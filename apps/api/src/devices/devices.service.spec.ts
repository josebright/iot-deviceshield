import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { ObjectLiteral, Repository } from 'typeorm';
import { DevicesService } from './devices.service';
import { Device } from './entities/device.entity';
import { Category } from '../category/entities/category.entity';

type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function mockRepository<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };
}

describe('DevicesService', () => {
  let service: DevicesService;
  let deviceRepo: MockRepo<Device>;
  let categoryRepo: MockRepo<Category>;

  beforeEach(async () => {
    deviceRepo = mockRepository<Device>();
    categoryRepo = mockRepository<Category>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        { provide: getRepositoryToken(Device), useValue: deviceRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
      ],
    }).compile();
    service = module.get(DevicesService);
  });

  describe('create', () => {
    it('creates a device attached to an existing category', async () => {
      const dto = { name: 'Nest Thermostat', categoryId: 3 };
      const category = { id: 3, name: 'Thermostats' } as Category;
      const device = { id: 10, name: dto.name, category } as Device;
      categoryRepo.findOne!.mockResolvedValue(category);
      deviceRepo.create!.mockReturnValue(device);
      deviceRepo.save!.mockResolvedValue(device);

      const result = await service.create(dto);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(deviceRepo.create).toHaveBeenCalledWith({ ...dto, category });
      expect(result).toBe(device);
    });

    it('throws NotFoundException when the category is missing', async () => {
      categoryRepo.findOne!.mockResolvedValue(null);
      await expect(service.create({ name: 'x', categoryId: 999 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(deviceRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('loads devices with category and vulnerabilities relations', async () => {
      deviceRepo.find!.mockResolvedValue([]);
      await service.findAll();
      expect(deviceRepo.find).toHaveBeenCalledWith({
        relations: ['category', 'vulnerabilities'],
      });
    });
  });

  describe('remove', () => {
    it('deletes by id when present', async () => {
      deviceRepo.delete!.mockResolvedValue({ affected: 1, raw: {} });
      await expect(service.remove(1)).resolves.toBeUndefined();
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      deviceRepo.delete!.mockResolvedValue({ affected: 0, raw: {} });
      await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
