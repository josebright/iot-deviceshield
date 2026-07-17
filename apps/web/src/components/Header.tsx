'use client';

import {
  AppBar,
  Box,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import Link from 'next/link';
import { useColorMode } from '@/theme/ColorModeContext';
import { Logo } from './Logo';

export function Header() {
  const theme = useTheme();
  const { mode, toggle } = useColorMode();

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'saturate(1.4) blur(12px)',
        backgroundColor: (t) =>
          t.palette.mode === 'dark' ? 'rgba(11, 15, 25, 0.72)' : 'rgba(247, 248, 251, 0.72)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 } }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            component={Link}
            href="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:focus-visible': { outline: 'none' },
            }}
            aria-label="IoT-DeviceShield home"
          >
            <Logo />
            <Stack spacing={0}>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.1 }}>
                IoT-DeviceShield
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Smart Home Risk
              </Typography>
            </Stack>
          </Stack>

          <Box sx={{ flex: 1 }} />

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={toggle}
              size="small"
              aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              {mode === 'dark' ? (
                <LightModeOutlined fontSize="small" />
              ) : (
                <DarkModeOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
