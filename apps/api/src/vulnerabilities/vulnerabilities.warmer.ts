import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilityCache } from './entities/vulnerability-cache.entity';
import type { Env } from '../config/env.schema';

const START_DELAY_MS = 15_000;
const PER_DEVICE_GAP_MS = 500;

@Injectable()
export class VulnerabilitiesWarmerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VulnerabilitiesWarmerService.name);
  private readonly enabled: boolean;

  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(VulnerabilityCache)
    private readonly cacheRepo: Repository<VulnerabilityCache>,
    private readonly vulnerabilities: VulnerabilitiesService,
    configService: ConfigService<Env, true>,
  ) {
    this.enabled = configService.get('WARM_CACHE_ON_BOOT', { infer: true });
  }

  onApplicationBootstrap(): void {
    if (!this.enabled) {
      this.logger.log('cache warmer disabled (WARM_CACHE_ON_BOOT=false)');
      return;
    }
    setTimeout(() => {
      this.warmInBackground().catch((err) =>
        this.logger.error(`warmer crashed: ${(err as Error).message}`),
      );
    }, START_DELAY_MS);
  }

  private async warmInBackground(): Promise<void> {
    const devices = await this.deviceRepo.find({ order: { slug: 'ASC' } });
    if (devices.length === 0) {
      this.logger.log('warmer: no devices to warm');
      return;
    }
    const cached = await this.cacheRepo.find();
    const cachedIds = new Set(cached.map((c) => c.deviceId));
    const cold = devices.filter((d) => !cachedIds.has(d.id));
    if (cold.length === 0) {
      this.logger.log(`warmer: ${devices.length} devices already cached; skipping`);
      return;
    }
    this.logger.log(`warmer: warming ${cold.length} of ${devices.length} devices in background`);
    let done = 0;
    for (const device of cold) {
      const start = Date.now();
      try {
        const res = await this.vulnerabilities.fetchByDeviceSlug(device.slug);
        this.logger.log(
          `warmer: ${device.slug} — ${res.items.length} findings in ${Date.now() - start}ms`,
        );
      } catch (err) {
        this.logger.warn(`warmer: ${device.slug} failed: ${(err as Error).message}`);
      }
      done += 1;
      if (done < cold.length) {
        await new Promise((r) => setTimeout(r, PER_DEVICE_GAP_MS));
      }
    }
    this.logger.log(`warmer: done, ${done}/${cold.length} devices processed`);
  }
}
