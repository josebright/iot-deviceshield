/**
 * Mock openai at the module level so the service constructor never tries to
 * reach the real API. This must be declared before `import`ing the service.
 */
const openAiCreateMock = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: openAiCreateMock } },
    })),
  };
});

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import type { ObjectLiteral, Repository } from 'typeorm';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { Vulnerability } from './entities/vulnerability.entity';
import { Device } from '../devices/entities/device.entity';

type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function mockRepo<T extends ObjectLiteral>(): MockRepo<T> {
  return { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
}

function aiReply(content: string) {
  return { choices: [{ message: { content } }] };
}

function buildNvdItem(cveId: string) {
  return {
    cve: {
      id: cveId,
      lastModified: '2025-01-01T00:00:00Z',
      vulnStatus: 'Analyzed',
      descriptions: [{ lang: 'en', value: 'A router allows remote command execution.' }],
      references: [{ url: 'https://example.com/cve' }],
      metrics: {
        cvssMetricV31: [
          {
            cvssData: {
              version: '3.1',
              baseScore: 9.8,
              baseSeverity: 'CRITICAL',
              availabilityImpact: 'HIGH',
              integrityImpact: 'HIGH',
            },
            exploitabilityScore: 3.9,
            impactScore: 5.9,
          },
        ],
      },
    },
  };
}

describe('VulnerabilitiesService', () => {
  let service: VulnerabilitiesService;
  let vulnRepo: MockRepo<Vulnerability>;
  let deviceRepo: MockRepo<Device>;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    openAiCreateMock.mockReset();
    vulnRepo = mockRepo<Vulnerability>();
    deviceRepo = mockRepo<Device>();
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VulnerabilitiesService,
        { provide: HttpService, useValue: httpService },
        { provide: getRepositoryToken(Vulnerability), useValue: vulnRepo },
        { provide: getRepositoryToken(Device), useValue: deviceRepo },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('sk-test') },
        },
      ],
    }).compile();
    service = module.get(VulnerabilitiesService);
  });

  it('throws NotFoundException when the device does not exist', async () => {
    deviceRepo.findOne!.mockResolvedValue(null);
    await expect(service.fetchVulnerabilities({ keywordSearch: 'ghost' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('throws ServiceUnavailableException when NIST is unreachable', async () => {
    deviceRepo.findOne!.mockResolvedValue({ id: 1, name: 'router' } as Device);
    httpService.get.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

    await expect(service.fetchVulnerabilities({ keywordSearch: 'router' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('creates new vulnerabilities and skips already-known CVE ids', async () => {
    const device = { id: 1, name: 'router' } as Device;
    deviceRepo.findOne!.mockResolvedValue(device);
    httpService.get.mockReturnValue(
      of({
        data: { vulnerabilities: [buildNvdItem('CVE-2025-0001'), buildNvdItem('CVE-2025-0002')] },
      }),
    );
    vulnRepo
      .findOne!.mockResolvedValueOnce(null) // CVE-2025-0001 is new
      .mockResolvedValueOnce({ id: 42 }); // CVE-2025-0002 already exists
    vulnRepo.create!.mockImplementation((v) => v);
    vulnRepo.save!.mockResolvedValue([]);
    vulnRepo.find!.mockResolvedValue([{ id: 100 } as Vulnerability]);

    openAiCreateMock.mockImplementation(({ messages }) => {
      const prompt = messages[0].content as string;
      return Promise.resolve(aiReply(`assessment for: ${prompt.slice(0, 20)}`));
    });

    const result = await service.fetchVulnerabilities({ keywordSearch: 'router' });

    // Only the new CVE gets built + saved.
    expect(vulnRepo.create).toHaveBeenCalledTimes(1);
    expect(vulnRepo.save).toHaveBeenCalledTimes(1);
    // 5 OpenAI prompts per new CVE (threat, recommendation, impact, affected, vuln).
    expect(openAiCreateMock).toHaveBeenCalledTimes(5);
    // Final response comes from the repository find().
    expect(result).toEqual([{ id: 100 }]);
    expect(vulnRepo.find).toHaveBeenCalledWith({
      where: { device: { id: device.id } },
      relations: ['device'],
    });
  });

  it('returns an empty AI string when OpenAI throws (never leaks stack)', async () => {
    const device = { id: 1, name: 'router' } as Device;
    deviceRepo.findOne!.mockResolvedValue(device);
    httpService.get.mockReturnValue(
      of({ data: { vulnerabilities: [buildNvdItem('CVE-2025-0003')] } }),
    );
    vulnRepo.findOne!.mockResolvedValue(null);
    vulnRepo.create!.mockImplementation((v) => v);
    vulnRepo.save!.mockResolvedValue([]);
    vulnRepo.find!.mockResolvedValue([]);
    openAiCreateMock.mockRejectedValue(new Error('OpenAI down'));

    await service.fetchVulnerabilities({ keywordSearch: 'router' });

    const created = vulnRepo.create!.mock.calls[0][0];
    // Every AI-generated field should be an empty string on failure — never
    // an error message persisted as content (the legacy bug we fixed).
    expect(created.threats).toBe('');
    expect(created.impact).toBe('');
    expect(created.recommendations).toBe('');
    expect(created.affectedSystem).toBe('');
    expect(created.vulnerability).toBe('');
  });
});
