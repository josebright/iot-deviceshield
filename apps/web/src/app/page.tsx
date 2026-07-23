import { Box, Paper, Stack, Typography } from '@mui/material';
import type { Category } from '@iot-deviceshield/types';
import { fetchCategoriesServer } from '@/lib/server-api';
import { PageShell } from '@/components/PageShell';
import { CategoryPicker } from '@/components/CategoryPicker';
import { EmptyState } from '@/components/EmptyState';
import { RetryError } from '@/components/RetryError';
import { FeaturesGrid } from '@/components/FeaturesGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let categories: Category[] | null = null;
  let errorMessage: string | null = null;
  try {
    categories = await fetchCategoriesServer();
  } catch (err) {
    console.error('Failed to load categories on the server', err);
    errorMessage = 'Unable to load categories. Please try again shortly.';
  }

  return (
    <PageShell>
      <Stack spacing={{ xs: 6, md: 10 }}>
        <Stack spacing={2}>
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Smart home risk assessment
          </Typography>
          <Typography variant="h1">Understand your device risk before an attacker does.</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
            Pick a device to see published CVEs, likelihood and impact scores, and remediation
            steps. Data comes from NIST NVD and is enriched by a locally-running LLM for
            plain-language explanations.
          </Typography>
        </Stack>

        <Paper
          component="section"
          aria-labelledby="picker-heading"
          sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}
        >
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography id="picker-heading" variant="h3">
                Start an assessment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a category, then a device.
              </Typography>
            </Stack>

            {errorMessage ? (
              <RetryError title="Cannot reach the API" description={errorMessage} />
            ) : !categories || categories.length === 0 ? (
              <EmptyState
                title="No devices catalogued yet"
                description="Run the catalog sync from the API workspace, then reload this page."
              />
            ) : (
              <CategoryPicker categories={categories} />
            )}
          </Stack>
        </Paper>

        <Box component="section" aria-labelledby="features-heading">
          <Typography id="features-heading" variant="h3" sx={{ mb: 3 }}>
            What you get
          </Typography>
          <FeaturesGrid />
        </Box>
      </Stack>
    </PageShell>
  );
}
