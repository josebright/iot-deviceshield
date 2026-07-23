import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminTokenGuard } from '../admin/admin-token.guard';
import { CatalogSyncService } from './catalog-sync.service';

@ApiTags('catalog')
@ApiBearerAuth('admin')
@Controller('catalog')
@UseGuards(AdminTokenGuard)
@SkipThrottle()
export class CatalogController {
  constructor(private readonly catalogSync: CatalogSyncService) {}

  @Post('refresh')
  refresh() {
    return this.catalogSync.runSync();
  }

  @Post('devices/:slug/resolve-cpe')
  resolveCpe(@Param('slug') slug: string) {
    return this.catalogSync.resolveCpeForDevice(slug);
  }

  @Get('status')
  status() {
    return this.catalogSync.getStatus();
  }
}
