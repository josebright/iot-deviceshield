import { Controller, Get, Param } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.devicesService.findBySlug(slug);
  }
}
