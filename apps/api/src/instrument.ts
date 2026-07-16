// Sentry must be initialized before ANY other import that could throw or run
// side effects, so this file is imported at the very top of `main.ts`.
// The @sentry/nestjs package layers NestJS-aware instrumentation
// (request context, DI-aware capture, `@SentryExceptionCaptured()`) on top
// of the @sentry/node core.
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn && dsn.trim() !== '') {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Sample rates are conservative defaults; tune per environment.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0,
    // No PII, no request bodies. The exception filter attaches request
    // context selectively via tags.
    sendDefaultPii: false,
  });
}
