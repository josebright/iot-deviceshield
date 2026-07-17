'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import type { Category, DeviceSummary } from '@iot-deviceshield/types';
import { apiClient } from '@/lib/api';
import { PageShell } from '@/components/PageShell';
import { RetryError } from '@/components/RetryError';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonHomeForm } from '@/components/skeletons';

const FEATURES = [
  {
    icon: DevicesOtherOutlined,
    title: 'Device inventory',
    body: 'Track the smart devices on your network across cameras, speakers, thermostats, locks, and routers.',
  },
  {
    icon: ShieldOutlined,
    title: 'CVE correlation',
    body: 'Match every device against the NIST National Vulnerability Database as findings publish.',
  },
  {
    icon: BoltOutlined,
    title: 'AI-assisted guidance',
    body: 'Get plain-language threat, impact, and remediation notes generated per finding.',
  },
];

export default function Home() {
  const [categoryData, setCategoryData] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [device, setDevice] = useState<string>('');
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    (async () => {
      try {
        const data = await apiClient.getCategories();
        if (!cancelled) {
          setCategoryData(data);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
        if (!cancelled) {
          setErrorMessage('Unable to load categories. Please try again shortly.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const onCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.value;
    setCategory(selected);
    const found = categoryData?.find((c) => c.name === selected);
    setDevices(found?.devices ?? []);
    setDevice('');
  };

  return (
    <PageShell>
      <Stack spacing={{ xs: 6, md: 8 }}>
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
          <Typography variant="h1" sx={{ maxWidth: 720 }}>
            Understand your device risk before an attacker does.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
            Pick a device to see published CVEs, likelihood and impact scores, and remediation
            steps. Data comes from NIST NVD and is enriched by an LLM for plain-language
            explanations.
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

            {loading ? (
              <SkeletonHomeForm />
            ) : errorMessage ? (
              <RetryError
                title="Cannot reach the API"
                description={errorMessage}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            ) : !categoryData || categoryData.length === 0 ? (
              <EmptyState
                title="No devices catalogued yet"
                description="Seed the database from the API workspace, then reload this page."
                action={{ label: 'Reload', onClick: () => setAttempt((n) => n + 1) }}
              />
            ) : (
              <Stack
                component="form"
                onSubmit={(event) => event.preventDefault()}
                spacing={2}
                sx={{ maxWidth: 480 }}
              >
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={onCategoryChange}
                  helperText="Groups of smart-home devices"
                >
                  {categoryData.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Device"
                  value={device}
                  onChange={(event) => setDevice(event.target.value)}
                  disabled={!devices.length}
                  helperText={
                    devices.length ? 'The exact model to assess' : 'Pick a category first'
                  }
                >
                  {devices.map((d) => (
                    <MenuItem key={d.id} value={d.name}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardOutlined />}
                    disabled={!device}
                    component={Link}
                    href={`/vulnerabilities?name=${encodeURIComponent(device)}`}
                    aria-label={
                      device ? `View risk assessment for ${device}` : 'Pick a device to continue'
                    }
                  >
                    View risk assessment
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </Paper>

        <Box component="section" aria-labelledby="features-heading">
          <Typography id="features-heading" variant="h3" sx={{ mb: 3 }}>
            What you get
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Paper key={title} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'primary.main',
                      backgroundColor: (t) =>
                        t.palette.mode === 'dark'
                          ? 'rgba(76, 133, 255, 0.14)'
                          : 'rgba(30, 78, 224, 0.08)',
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography variant="subtitle1">{title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {body}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Box>
      </Stack>
    </PageShell>
  );
}
