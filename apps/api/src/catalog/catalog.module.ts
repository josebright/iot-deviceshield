import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { Device } from '../devices/entities/device.entity';
import { AdminModule } from '../admin/admin.module';
import { CatalogMetadata } from './entities/catalog-metadata.entity';
import { CatalogSyncService } from './catalog-sync.service';
import { CpeResolverService } from './cpe-resolver.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Category, Device, CatalogMetadata]), AdminModule],
  providers: [CatalogSyncService, CpeResolverService],
  controllers: [CatalogController],
  exports: [CatalogSyncService],
})
export class CatalogModule {}
