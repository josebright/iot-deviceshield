import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VulnerabilitiesService } from './vulnerabilities.service';
import { VulnerabilitiesController } from './vulnerabilities.controller';
import { AiAssistantService } from './ai-assistant.service';
import { VulnerabilitiesWarmerService } from './vulnerabilities.warmer';
import { VulnerabilityCache } from './entities/vulnerability-cache.entity';
import { Device } from '../devices/entities/device.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([VulnerabilityCache, Device])],
  controllers: [VulnerabilitiesController],
  providers: [VulnerabilitiesService, AiAssistantService, VulnerabilitiesWarmerService],
})
export class VulnerabilitiesModule {}
