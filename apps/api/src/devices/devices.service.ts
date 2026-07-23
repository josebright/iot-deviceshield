import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  findAll(): Promise<Device[]> {
    return this.deviceRepository.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!device) {
      throw new NotFoundException(`No device found with slug: ${slug}`);
    }
    return device;
  }

  async findByName(name: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { name },
      relations: ['category'],
    });
    if (!device) {
      throw new NotFoundException(`No device found with name: ${name}`);
    }
    return device;
  }
}
