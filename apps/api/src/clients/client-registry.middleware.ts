import { ForbiddenException, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClientsService } from './clients.service';
import { attachClient } from './client-context';
import { extractFingerprintInput } from './fingerprint.util';

const BYPASS_PREFIXES = ['/v1/health'];

@Injectable()
export class ClientRegistryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ClientRegistryMiddleware.name);

  constructor(private readonly clientsService: ClientsService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const url = req.originalUrl.split('?')[0] ?? '';
    if (BYPASS_PREFIXES.some((p) => url.startsWith(p))) {
      return next();
    }
    try {
      const input = extractFingerprintInput(req);
      const client = await this.clientsService.touch(input);
      if (client.status === 'blacklisted') {
        throw new ForbiddenException('Client blocked. Contact the operator to resolve.');
      }
      attachClient(req, client);
      next();
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      this.logger.warn(`client-registry failed: ${(err as Error).message}`);
      next();
    }
  }
}
