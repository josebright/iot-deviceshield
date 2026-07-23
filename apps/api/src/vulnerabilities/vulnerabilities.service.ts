import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import type {
  Vulnerability,
  VulnerabilityMatchSource,
  VulnerabilityResponse,
} from '@iot-deviceshield/types';
import { Device } from '../devices/entities/device.entity';
import { VulnerabilityCache } from './entities/vulnerability-cache.entity';
import { mapCvssMetric } from './cvss.mapper';
import type { NvdCve, NvdResponse } from './nist.types';
import type { Env } from '../config/env.schema';
import { AiAssistantService, hasAiContent } from './ai-assistant.service';

const NVD_CVE_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CPE_CONFIDENCE_THRESHOLD = 0.5;

@Injectable()
export class VulnerabilitiesService {
  private readonly logger = new Logger(VulnerabilitiesService.name);
  private readonly cacheTtlMs: number;
  private readonly nvdApiKey: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(VulnerabilityCache)
    private readonly cacheRepository: Repository<VulnerabilityCache>,
    private readonly aiAssistant: AiAssistantService,
    configService: ConfigService<Env, true>,
  ) {
    this.cacheTtlMs = configService.get('CVE_CACHE_MINUTES', { infer: true }) * 60 * 1000;
    this.nvdApiKey = configService.get('NVD_API_KEY', { infer: true });
  }

  async fetchByDeviceName(name: string): Promise<VulnerabilityResponse> {
    const device = await this.deviceRepository.findOne({ where: { name } });
    if (!device) {
      throw new NotFoundException(`No device found with the name: ${name}`);
    }
    return this.fetchForDevice(device);
  }

  async fetchByDeviceSlug(slug: string): Promise<VulnerabilityResponse> {
    const device = await this.deviceRepository.findOne({ where: { slug } });
    if (!device) {
      throw new NotFoundException(`No device found with slug: ${slug}`);
    }
    return this.fetchForDevice(device);
  }

  private async fetchForDevice(device: Device): Promise<VulnerabilityResponse> {
    const cached = await this.cacheRepository.findOne({ where: { deviceId: device.id } });
    if (cached && Date.now() - cached.fetchedAt.getTime() < this.cacheTtlMs) {
      return this.responseFromCache(device, cached, true);
    }

    const useCpe =
      device.cpeName !== null &&
      device.cpeConfidence !== null &&
      device.cpeConfidence >= CPE_CONFIDENCE_THRESHOLD;
    const matchSource: VulnerabilityMatchSource = useCpe ? 'cpe' : 'keyword';
    const matchQuery = useCpe ? (device.cpeName as string) : device.name;

    let response;
    try {
      response = await firstValueFrom(
        this.httpService.get<NvdResponse>(NVD_CVE_URL, {
          params: useCpe ? { cpeName: matchQuery } : { keywordSearch: matchQuery },
          headers: this.nvdApiKey ? { apiKey: this.nvdApiKey } : undefined,
          timeout: 20_000,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`NIST NVD fetch failed for "${matchQuery}": ${message}`);
      if (cached) {
        return this.responseFromCache(device, cached, true);
      }
      throw new ServiceUnavailableException('Vulnerability feed is unavailable');
    }

    const items = response.data.vulnerabilities ?? [];
    const built: Vulnerability[] = [];
    for (const item of items) {
      built.push(await this.buildVulnerability(item.cve));
    }

    const anyAi = built.some(hasAiContent);
    const now = new Date();

    if (anyAi) {
      const entity = cached ?? this.cacheRepository.create({ deviceId: device.id });
      entity.payload = built;
      entity.matchSource = matchSource;
      entity.matchQuery = matchQuery;
      entity.cpeConfidence = device.cpeConfidence ?? null;
      entity.fetchedAt = now;
      await this.cacheRepository.save(entity);
    } else {
      this.logger.warn(
        `Skipping cache write for device ${device.slug}: all AI fields empty (LLM likely rate-limited)`,
      );
    }

    return {
      deviceSlug: device.slug,
      deviceName: device.name,
      matchSource,
      matchQuery,
      cpeConfidence: device.cpeConfidence ?? null,
      fetchedAt: now.toISOString(),
      cached: false,
      items: built,
    };
  }

  private responseFromCache(
    device: Device,
    cached: VulnerabilityCache,
    fromCacheFlag: boolean,
  ): VulnerabilityResponse {
    return {
      deviceSlug: device.slug,
      deviceName: device.name,
      matchSource: cached.matchSource,
      matchQuery: cached.matchQuery,
      cpeConfidence: cached.cpeConfidence,
      fetchedAt: cached.fetchedAt.toISOString(),
      cached: fromCacheFlag,
      items: cached.payload,
    };
  }

  private async buildVulnerability(cve: NvdCve): Promise<Vulnerability> {
    const metricsPayload = cve.metrics ?? {};
    const cvssV3 = metricsPayload.cvssMetricV30 ?? metricsPayload.cvssMetricV31 ?? [];
    const cvssV2 = metricsPayload.cvssMetricV2 ?? [];
    const metrics = [...cvssV3, ...cvssV2].map(mapCvssMetric);

    const description =
      cve.descriptions.find((d) => d.lang === 'en')?.value ?? cve.descriptions[0]?.value ?? '';

    const ai = await this.aiAssistant.generate(description);

    return {
      cveId: cve.id,
      vulnerability: ai.vulnerability,
      lastModified: cve.lastModified ?? null,
      vulnStatus: cve.vulnStatus ?? null,
      references: cve.references.map((r) => r.url),
      metrics,
      impact: ai.impact,
      affectedSystem: ai.affectedSystem,
      threats: ai.threats,
      recommendations: ai.recommendations,
    };
  }
}
