import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import OpenAI from 'openai';
import { Repository } from 'typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import { Device } from '../devices/entities/device.entity';
import { FetchVulnerabilitiesDto } from './dto/fetch-vulnerability.dto';
import { mapCvssMetric } from './cvss.mapper';
import type { NvdCve, NvdResponse } from './nist.types';
import type { Env } from '../config/env.schema';

const NVD_API_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

@Injectable()
export class VulnerabilitiesService {
  private readonly logger = new Logger(VulnerabilitiesService.name);
  private readonly openAI: OpenAI;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Vulnerability)
    private readonly vulnerabilityRepository: Repository<Vulnerability>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    configService: ConfigService<Env, true>,
  ) {
    this.openAI = new OpenAI({
      apiKey: configService.get('OPENAI_API_KEY', { infer: true }),
    });
  }

  async fetchVulnerabilities(dto: FetchVulnerabilitiesDto): Promise<Vulnerability[]> {
    const device = await this.deviceRepository.findOne({ where: { name: dto.keywordSearch } });
    if (!device) {
      throw new NotFoundException(`No device found with the name: ${dto.keywordSearch}`);
    }

    let response;
    try {
      response = await firstValueFrom(
        this.httpService.get<NvdResponse>(NVD_API_URL, {
          params: { keywordSearch: dto.keywordSearch },
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`NIST NVD fetch failed for "${dto.keywordSearch}": ${message}`);
      throw new ServiceUnavailableException('Vulnerability feed is unavailable');
    }

    const items = response.data.vulnerabilities ?? [];
    const created: Vulnerability[] = [];

    for (const item of items) {
      const existing = await this.vulnerabilityRepository.findOne({
        where: { cveId: item.cve.id },
      });
      if (existing) {
        continue;
      }
      const vuln = await this.buildVulnerability(item.cve, device);
      created.push(vuln);
    }

    if (created.length > 0) {
      await this.vulnerabilityRepository.save(created);
    }

    return this.vulnerabilityRepository.find({
      where: { device: { id: device.id } },
      relations: ['device'],
    });
  }

  private async buildVulnerability(cve: NvdCve, device: Device): Promise<Vulnerability> {
    const metricsPayload = cve.metrics ?? {};
    const cvssV3 = metricsPayload.cvssMetricV30 ?? metricsPayload.cvssMetricV31 ?? [];
    const cvssV2 = metricsPayload.cvssMetricV2 ?? [];
    const metrics = [...cvssV3, ...cvssV2].map(mapCvssMetric);

    const description =
      cve.descriptions.find((d) => d.lang === 'en')?.value ?? cve.descriptions[0]?.value ?? '';

    const [threats, recommendations, impact, affectedSystem, vulnerability] = await Promise.all([
      this.generateAssessment(this.threatPrompt(description)),
      this.generateAssessment(this.recommendationPrompt(description)),
      this.generateAssessment(this.impactPrompt(description)),
      this.generateAssessment(this.affectedSystemPrompt(description)),
      this.generateAssessment(this.vulnerabilityPrompt(description)),
    ]);

    return this.vulnerabilityRepository.create({
      cveId: cve.id,
      vulnerability,
      lastModified: cve.lastModified ?? null,
      vulnStatus: cve.vulnStatus ?? null,
      device,
      references: cve.references.map((r) => r.url),
      metrics,
      impact,
      affectedSystem,
      threats,
      recommendations,
    });
  }

  private async generateAssessment(prompt: string): Promise<string> {
    try {
      const response = await this.openAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 250,
      });
      return response.choices[0]?.message.content ?? '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`OpenAI call failed: ${message}`);
      return '';
    }
  }

  private threatPrompt(description: string): string {
    return `Threat is a negative or malicious event that can exploit a vulnerability. From this definition, without starting with the words; "The threat is..." or "In simple terms...". Be concised and state the threat in: "${description}"?`;
  }

  private impactPrompt(description: string): string {
    return `Be concised and in layman's terms without starting with the words: "The impact of the vulnerability..." or "The potential impact of the vulnerability..." or "In simple terms...", what is the potential impact in: "${description}"?`;
  }

  private recommendationPrompt(description: string): string {
    return `Be concised and in a layman's terms without starting with the "In simple terms..." or "I recommend..." words, provide recommendation for mitigating the threats with the description: ${description}.`;
  }

  private affectedSystemPrompt(description: string): string {
    return `Without starting with the words: "In simple terms..." or "The affected systems...", just only list the affected systems in: "${description}".`;
  }

  private vulnerabilityPrompt(description: string): string {
    return `Vulnerability is a loophole or weakness in a device that can be exploited. From this definition, without starting with the words; "The vulnerability name is..." or "The device is vulnerable to...". Just give the name of the vulnerability in "${description}".`;
  }
}
