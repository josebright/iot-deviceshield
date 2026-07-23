import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { VulnerabilitiesService } from './vulnerabilities.service';

class FetchVulnerabilitiesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  keywordSearch?: string;
}

@Controller('vulnerabilities')
export class VulnerabilitiesController {
  constructor(private readonly vulnerabilitiesService: VulnerabilitiesService) {}

  @Get()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  async getAll(@Query() query: FetchVulnerabilitiesQueryDto) {
    if (query.slug) {
      return this.vulnerabilitiesService.fetchByDeviceSlug(query.slug);
    }
    const name = query.name ?? query.keywordSearch;
    if (!name) {
      throw new Error('Provide slug, name, or keywordSearch');
    }
    return this.vulnerabilitiesService.fetchByDeviceName(name);
  }
}
