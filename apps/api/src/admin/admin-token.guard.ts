import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { Env } from '../config/env.schema';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'];
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const presented = Buffer.from(header.slice(7).trim(), 'utf-8');
    const expected = Buffer.from(
      this.configService.get('ADMIN_API_TOKEN', { infer: true }),
      'utf-8',
    );
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
