import { Inject, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  getOptionsToken,
  getStorageToken,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';
import { ClientsService } from './clients.service';
import { getClient } from './client-context';
import { computeFingerprint, extractFingerprintInput } from './fingerprint.util';

@Injectable()
export class ClientThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly clientsService: ClientsService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const expressReq = req as unknown as Request;
    const client = getClient(expressReq);
    if (client) {
      return `client:${client.id}`;
    }
    return `fp:${computeFingerprint(extractFingerprintInput(expressReq))}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>();
    const client = getClient(req);
    if (client) {
      await this.clientsService.recordThrottleStrike(
        client,
        `rate limit exceeded (${detail.tracker})`,
      );
    }
    return super.throwThrottlingException(context, detail);
  }
}
