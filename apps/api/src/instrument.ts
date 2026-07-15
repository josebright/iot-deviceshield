// Sentry must be initialized before ANY other import that could throw or run
// side effects, so this file is imported at the very top of `main.ts`.
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Sample rates are conservative defaults; tune per environment.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0,
    // Don't send default PII automatically; the exception filter attaches
    // request context selectively.
    sendDefaultPii: false,
  });
}
