'use client';

import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';

export function RetryError({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      variant="outlined"
      role="alert"
      sx={{ borderRadius: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" startIcon={<ReplayOutlined />} onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{title}</AlertTitle>
      <Stack spacing={0.5}>{description ? <span>{description}</span> : null}</Stack>
    </Alert>
  );
}
