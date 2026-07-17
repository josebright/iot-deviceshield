'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button, Stack, Typography } from '@mui/material';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import { PageShell } from '@/components/PageShell';

export default function Error({
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
    <PageShell>
      <Stack
        spacing={2}
        sx={{ maxWidth: 560, mx: 'auto', textAlign: 'center', py: { xs: 6, md: 10 } }}
      >
        <Typography variant="caption" color="error.main" sx={{ letterSpacing: '0.1em' }}>
          SOMETHING WENT WRONG
        </Typography>
        <Typography variant="h1">We hit an unexpected error</Typography>
        <Typography variant="body1" color="text.secondary">
          The dashboard could not render this page. Our team has been notified.
        </Typography>
        {error.digest ? (
          <Typography variant="caption" color="text.secondary">
            Reference: {error.digest}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<ReplayOutlined />} onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="outlined" href="/">
            Back to home
          </Button>
        </Stack>
      </Stack>
    </PageShell>
  );
}
