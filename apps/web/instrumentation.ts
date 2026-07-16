import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn || dsn.trim() === '') {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      sendDefaultPii: false,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
