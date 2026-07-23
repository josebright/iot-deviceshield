'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

interface Feature {
  key: 'inventory' | 'cve' | 'ai';
  title: string;
  body: string;
}

const ICONS: Record<Feature['key'], SvgIconComponent> = {
  inventory: DevicesOtherOutlined,
  cve: ShieldOutlined,
  ai: BoltOutlined,
};

const FEATURES: Feature[] = [
  {
    key: 'inventory',
    title: 'Device inventory',
    body: 'Track the smart devices on your network across cameras, speakers, thermostats, locks, and routers.',
  },
  {
    key: 'cve',
    title: 'CVE correlation',
    body: 'Match every device against the NIST National Vulnerability Database as findings publish.',
  },
  {
    key: 'ai',
    title: 'AI-assisted guidance',
    body: 'Plain-language threat, impact, and mitigation notes generated locally per finding.',
  },
];

export function FeaturesGrid() {
  return (
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
      {FEATURES.map(({ key, title, body }) => {
        const Icon = ICONS[key];
        return (
          <Paper key={key} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
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
        );
      })}
    </Box>
  );
}
