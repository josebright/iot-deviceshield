import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { Env } from '../config/env.schema';
import type { NvdCpeResponse } from './nist-cpe.types';
import type { CatalogDevice } from '@iot-deviceshield/catalog';

const NVD_CPE_URL = 'https://services.nvd.nist.gov/rest/json/cpes/2.0';

export interface CpeMatch {
  cpeName: string;
  confidence: number;
}

@Injectable()
export class CpeResolverService {
  private readonly logger = new Logger(CpeResolverService.name);
  private readonly apiKey: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService<Env, true>,
  ) {
    this.apiKey = configService.get('NVD_API_KEY', { infer: true });
  }

  async resolve(device: CatalogDevice): Promise<CpeMatch | null> {
    const keyword = device.cpeHint ?? `${device.vendor} ${device.product}`;
    const params = { keywordSearch: keyword, resultsPerPage: '10' };
    const headers = this.apiKey ? { apiKey: this.apiKey } : undefined;

    try {
      const res = await firstValueFrom(
        this.httpService.get<NvdCpeResponse>(NVD_CPE_URL, { params, headers, timeout: 15_000 }),
      );
      const candidates = res.data.products ?? [];
      if (candidates.length === 0) {
        return null;
      }
      const scored = candidates
        .filter((c) => !c.cpe.deprecated)
        .map((c) => ({
          cpeName: c.cpe.cpeName,
          confidence: this.score(c.cpe.cpeName, device),
        }))
        .sort((a, b) => b.confidence - a.confidence);
      const best = scored[0];
      return best ?? null;
    } catch (err) {
      this.logger.warn(`CPE resolve failed for ${device.slug}: ${(err as Error).message}`);
      return null;
    }
  }

  private score(cpeName: string, device: CatalogDevice): number {
    const parts = cpeName.split(':');
    if (parts.length < 6) {
      return 0;
    }
    const part = parts[2] ?? '';
    const vendor = (parts[3] ?? '').toLowerCase();
    const product = (parts[4] ?? '').toLowerCase();

    let score = 0;
    if (vendor === device.vendor.toLowerCase()) {
      score += 0.45;
    } else if (vendor.includes(device.vendor.toLowerCase())) {
      score += 0.2;
    }
    const targetProduct = device.product.toLowerCase();
    if (product === targetProduct) {
      score += 0.45;
    } else if (product.includes(targetProduct) || targetProduct.includes(product)) {
      score += 0.25;
    }
    if (part === 'h') {
      score += 0.1;
    } else if (part === 'a') {
      score += 0.05;
    }
    return Math.min(score, 1);
  }
}
