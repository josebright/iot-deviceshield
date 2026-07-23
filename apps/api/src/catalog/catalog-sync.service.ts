import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, type Repository } from 'typeorm';
import { loadCatalog, type CatalogDevice } from '@iot-deviceshield/catalog';
import { Category } from '../category/entities/category.entity';
import { Device } from '../devices/entities/device.entity';
import { CatalogMetadata } from './entities/catalog-metadata.entity';
import { CpeResolverService } from './cpe-resolver.service';
import type { Env } from '../config/env.schema';

@Injectable()
export class CatalogSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CatalogSyncService.name);
  private readonly cpeTtlMs: number;
  private syncInFlight = false;

  constructor(
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(CatalogMetadata) private readonly metaRepo: Repository<CatalogMetadata>,
    private readonly cpeResolver: CpeResolverService,
    configService: ConfigService<Env, true>,
  ) {
    const days = configService.get('CPE_RESOLVE_TTL_DAYS', { infer: true });
    this.cpeTtlMs = days * 24 * 60 * 60 * 1000;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.runSync().catch((err) =>
      this.logger.error(`bootstrap sync failed: ${(err as Error).message}`),
    );
  }

  @Cron('0 3 * * *')
  async scheduledSync(): Promise<void> {
    await this.runSync();
  }

  async runSync(): Promise<{
    categoriesUpserted: number;
    devicesUpserted: number;
    cpeResolved: number;
  }> {
    if (this.syncInFlight) {
      this.logger.log('sync already in flight, skipping');
      return { categoriesUpserted: 0, devicesUpserted: 0, cpeResolved: 0 };
    }
    this.syncInFlight = true;
    const started = Date.now();
    let categoriesUpserted = 0;
    let devicesUpserted = 0;

    try {
      const { catalog, sourceVersion } = loadCatalog();

      for (const cat of catalog.categories) {
        let category = await this.categoryRepo.findOne({ where: { slug: cat.slug } });
        if (!category) {
          category = this.categoryRepo.create({ slug: cat.slug, name: cat.name });
          categoriesUpserted += 1;
        } else if (category.name !== cat.name) {
          category.name = cat.name;
          categoriesUpserted += 1;
        }
        await this.categoryRepo.save(category);

        for (const dev of cat.devices) {
          let device = await this.deviceRepo.findOne({ where: { slug: dev.slug } });
          if (!device) {
            device = this.deviceRepo.create({
              slug: dev.slug,
              name: dev.name,
              vendor: dev.vendor,
              product: dev.product,
              categoryId: category.id,
            });
            devicesUpserted += 1;
          } else {
            const changed =
              device.name !== dev.name ||
              device.vendor !== dev.vendor ||
              device.product !== dev.product ||
              device.categoryId !== category.id;
            if (changed) {
              device.name = dev.name;
              device.vendor = dev.vendor;
              device.product = dev.product;
              device.categoryId = category.id;
              devicesUpserted += 1;
            }
          }
          await this.deviceRepo.save(device);
        }
      }

      const cpeResolved = await this.resolvePendingCpes(
        catalog.categories.flatMap((c) => c.devices),
      );

      await this.writeMetadata({ sourceVersion, lastError: null });
      this.logger.log(
        `catalog sync done in ${Date.now() - started}ms: categories=${categoriesUpserted} devices=${devicesUpserted} cpe=${cpeResolved}`,
      );
      return { categoriesUpserted, devicesUpserted, cpeResolved };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`catalog sync failed: ${message}`);
      await this.writeMetadata({ sourceVersion: null, lastError: message, incrementError: true });
      throw err;
    } finally {
      this.syncInFlight = false;
    }
  }

  async resolveCpeForDevice(slug: string): Promise<Device> {
    const device = await this.deviceRepo.findOneOrFail({ where: { slug } });
    const catalogDevice: CatalogDevice = {
      slug: device.slug,
      name: device.name,
      vendor: device.vendor ?? device.slug,
      product: device.product ?? device.slug,
    };
    const match = await this.cpeResolver.resolve(catalogDevice);
    device.cpeName = match?.cpeName ?? null;
    device.cpeConfidence = match?.confidence ?? null;
    device.cpeResolvedAt = new Date();
    return this.deviceRepo.save(device);
  }

  private async resolvePendingCpes(catalogDevices: CatalogDevice[]): Promise<number> {
    const staleCutoff = new Date(Date.now() - this.cpeTtlMs);
    const pending = await this.deviceRepo.find({
      where: [
        { cpeName: IsNull() },
        { cpeResolvedAt: IsNull() },
        { cpeResolvedAt: LessThan(staleCutoff) },
        {
          cpeConfidence: LessThan(0.5),
          cpeResolvedAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        },
      ],
    });
    if (pending.length === 0) {
      return 0;
    }
    let resolved = 0;
    for (const device of pending) {
      const catalogDev = catalogDevices.find((d) => d.slug === device.slug);
      if (!catalogDev) {
        continue;
      }
      const match = await this.cpeResolver.resolve(catalogDev);
      device.cpeName = match?.cpeName ?? null;
      device.cpeConfidence = match?.confidence ?? null;
      device.cpeResolvedAt = new Date();
      await this.deviceRepo.save(device);
      if (match) {
        resolved += 1;
      }
    }
    return resolved;
  }

  async getStatus(): Promise<{
    lastRefreshAt: Date | null;
    sourceVersion: string | null;
    errorCount: number;
    lastError: string | null;
    categoriesCount: number;
    devicesCount: number;
    cpeResolvedCount: number;
    cpeUnresolvedCount: number;
  }> {
    const meta = await this.metaRepo.findOne({ where: { id: 1 } });
    const [categoriesCount, devicesCount, cpeResolvedCount, cpeUnresolvedCount] = await Promise.all(
      [
        this.categoryRepo.count(),
        this.deviceRepo.count(),
        this.deviceRepo.count({ where: { cpeName: Not(IsNull()) } }),
        this.deviceRepo.count({ where: { cpeName: IsNull() } }),
      ],
    );
    return {
      lastRefreshAt: meta?.lastRefreshAt ?? null,
      sourceVersion: meta?.sourceVersion ?? null,
      errorCount: meta?.errorCount ?? 0,
      lastError: meta?.lastError ?? null,
      categoriesCount,
      devicesCount,
      cpeResolvedCount,
      cpeUnresolvedCount,
    };
  }

  private async writeMetadata(input: {
    sourceVersion: string | null;
    lastError: string | null;
    incrementError?: boolean;
  }): Promise<void> {
    const existing =
      (await this.metaRepo.findOne({ where: { id: 1 } })) ?? this.metaRepo.create({ id: 1 });
    if (input.sourceVersion) {
      existing.sourceVersion = input.sourceVersion;
      existing.lastRefreshAt = new Date();
    }
    existing.lastError = input.lastError;
    if (input.incrementError) {
      existing.errorCount = (existing.errorCount ?? 0) + 1;
    }
    await this.metaRepo.save(existing);
  }
}
