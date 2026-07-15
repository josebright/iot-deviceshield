import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { FetchVulnerabilitiesDto } from './dto/fetch-vulnerability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vulnerabilities')
@UseGuards(JwtAuthGuard)
export class VulnerabilitiesController {
  constructor(private readonly vulnerabilitiesService: VulnerabilitiesService) {}

  @Get()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  getAllVulnerabilities(@Query() query: FetchVulnerabilitiesDto) {
    return this.vulnerabilitiesService.fetchVulnerabilities(query);
  }
}
