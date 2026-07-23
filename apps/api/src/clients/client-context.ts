import type { Request } from 'express';
import type { Client } from './entities/client.entity';

export interface RequestWithClient extends Request {
  client?: Client;
}

export function attachClient(req: Request, client: Client): void {
  (req as RequestWithClient).client = client;
}

export function getClient(req: Request): Client | undefined {
  return (req as RequestWithClient).client;
}
