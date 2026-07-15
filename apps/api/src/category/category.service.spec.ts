import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { ObjectLiteral, Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function mockRepository<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
}

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: MockRepo<Category>;

  beforeEach(async () => {
    repo = mockRepository<Category>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, { provide: getRepositoryToken(Category), useValue: repo }],
    }).compile();
    service = module.get(CategoryService);
  });

  describe('create', () => {
    it('creates and persists a category', async () => {
      const dto = { name: 'Smart Bulbs' };
      const entity = { id: 1, name: dto.name } as Category;
      repo.create!.mockReturnValue(entity);
      repo.save!.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });
  });

  describe('findAll', () => {
    it('returns categories with their devices', async () => {
      const rows = [{ id: 1, name: 'Bulbs', devices: [] }] as Category[];
      repo.find!.mockResolvedValue(rows);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({ relations: ['devices'] });
      expect(result).toBe(rows);
    });
  });

  describe('remove', () => {
    it('deletes by id', async () => {
      repo.delete!.mockResolvedValue({ affected: 1, raw: {} });
      await service.remove(7);
      expect(repo.delete).toHaveBeenCalledWith(7);
    });
  });
});
