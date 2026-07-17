'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#0b0f19',
          color: '#e6ecff',
          minHeight: '100vh',
        }}
      >
        <main
          style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '96px 24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: '0.15em',
              margin: 0,
              color: '#ff6b6b',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Application error
          </p>
          <h1
            style={{
              fontSize: 40,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginTop: 16,
              marginBottom: 12,
            }}
          >
            The dashboard could not start
          </h1>
          <p style={{ opacity: 0.72, margin: 0, marginBottom: 16, lineHeight: 1.55 }}>
            A low-level error prevented the app from rendering. Reload to try again.
          </p>
          {error.digest ? (
            <p style={{ opacity: 0.6, fontSize: 12 }}>Reference: {error.digest}</p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid rgba(230,236,255,0.2)',
              background: '#2a67f5',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
