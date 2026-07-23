import { createHash } from 'node:crypto';
import type { Request } from 'express';

export interface FingerprintInput {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  clientIdHeader: string | null;
}

export function extractFingerprintInput(req: Request): FingerprintInput {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : undefined;
  const ip = forwardedIp || req.socket.remoteAddress || '0.0.0.0';

  const userAgent = firstHeader(req.headers['user-agent']) ?? '';
  const acceptLanguage = firstHeader(req.headers['accept-language']) ?? '';
  const rawClientId = firstHeader(req.headers['x-client-id']);
  const clientIdHeader = rawClientId && /^[0-9a-f-]{8,64}$/i.test(rawClientId) ? rawClientId : null;

  return { ip, userAgent, acceptLanguage, clientIdHeader };
}

export function computeFingerprint(input: FingerprintInput): string {
  const material = [
    input.ip,
    input.userAgent,
    input.acceptLanguage,
    input.clientIdHeader ?? '',
  ].join('\n');
  return createHash('sha256').update(material).digest('hex');
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
