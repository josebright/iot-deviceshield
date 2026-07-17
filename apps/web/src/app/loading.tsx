import { Skeleton, Stack } from '@mui/material';
import { PageShell } from '@/components/PageShell';

export default function Loading() {
  return (
    <PageShell>
      <Stack spacing={3}>
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="text" width="70%" height={56} />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    </PageShell>
  );
}
