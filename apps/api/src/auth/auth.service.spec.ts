jest.mock('argon2', () => ({
  __esModule: true,
  argon2id: 2,
  hash: jest.fn().mockResolvedValue('hashed'),
  verify: jest.fn(),
}));

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import type { ObjectLiteral, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';

type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const argonVerify = argon2.verify as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: MockRepo<User>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a new user with a hashed password and normalized email', async () => {
      userRepo.findOne!.mockResolvedValue(null);
      userRepo.save!.mockImplementation((u) => Promise.resolve({ ...u, id: 1 }));

      const result = await service.register({
        email: 'USER@Example.COM',
        password: 'a-strong-pw-here',
      });

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(argon2.hash).toHaveBeenCalledWith('a-strong-pw-here', { type: argon2.argon2id });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          passwordHash: 'hashed',
          role: UserRole.User,
        }),
      );
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 1, email: 'user@example.com', role: UserRole.User });
    });

    it('rejects duplicate emails with ConflictException', async () => {
      userRepo.findOne!.mockResolvedValue({ id: 1 });
      await expect(
        service.register({ email: 'dup@example.com', password: 'a-strong-pw-here' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const user = {
      id: 5,
      email: 'user@example.com',
      passwordHash: 'hashed',
      role: UserRole.User,
    } as User;

    it('issues a JWT on correct credentials', async () => {
      userRepo.findOne!.mockResolvedValue(user);
      argonVerify.mockResolvedValue(true);

      const result = await service.login({
        email: 'USER@example.com',
        password: 'a-strong-pw-here',
      });

      expect(argon2.verify).toHaveBeenCalledWith('hashed', 'a-strong-pw-here');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 5,
        email: user.email,
        role: UserRole.User,
      });
      expect(result.accessToken).toBe('signed.jwt.token');
    });

    it('returns UnauthorizedException with a generic message on unknown email', async () => {
      userRepo.findOne!.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns UnauthorizedException on wrong password', async () => {
      userRepo.findOne!.mockResolvedValue(user);
      argonVerify.mockResolvedValue(false);
      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
