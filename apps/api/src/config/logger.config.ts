import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';
import type { Env } from './env.schema';

/**
 * Redact any header, query, or body field that may leak credentials.
 * Extend with care — anything not listed here is logged in full.
 */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.body.password',
  'req.body.passwordHash',
  'req.body.token',
  'req.body.accessToken',
];

export function buildLoggerParams(env: Env): Params {
  const isProduction = env.NODE_ENV === 'production';
  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      redact: {
        paths: REDACT_PATHS,
        censor: '[REDACTED]',
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:HH:MM:ss.l',
              ignore: 'pid,hostname,req.remoteAddress',
            },
          },
    },
  };
}
