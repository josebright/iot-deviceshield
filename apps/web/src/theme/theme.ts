'use client';

import { createTheme, responsiveFontSizes, type PaletteMode } from '@mui/material';
import { tokens } from './tokens';

const shared = {
  shape: {
    borderRadius: tokens.radius.md,
  },
  typography: {
    fontFamily: 'var(--font-sans)',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      fontSize: 'clamp(2rem, 4vw, 3rem)',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.015em',
      lineHeight: 1.15,
      fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
    },
    h3: {
      fontWeight: 600,
      lineHeight: 1.2,
      fontSize: 'clamp(1.15rem, 1.8vw, 1.375rem)',
    },
    subtitle1: { fontWeight: 500 },
    body1: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none' as const, letterSpacing: 0 },
  },
  transitions: {
    duration: {
      shortest: 120,
      shorter: 160,
      short: 200,
      standard: 240,
      complex: 320,
      enteringScreen: 220,
      leavingScreen: 180,
    },
  },
} as const;

function paletteFor(mode: PaletteMode) {
  const isDark = mode === 'dark';
  return {
    mode,
    primary: {
      main: isDark ? tokens.brand[400] : tokens.brand[600],
      contrastText: '#ffffff',
    },
    background: {
      default: isDark ? '#0b0f19' : '#f7f8fb',
      paper: isDark ? '#141a29' : '#ffffff',
    },
    text: {
      primary: isDark ? '#e6ecff' : '#0e1220',
      secondary: isDark ? 'rgba(230, 236, 255, 0.68)' : 'rgba(14, 18, 32, 0.68)',
    },
    divider: isDark ? 'rgba(230, 236, 255, 0.12)' : 'rgba(14, 18, 32, 0.10)',
  };
}

export function buildTheme(mode: PaletteMode) {
  const base = createTheme({
    ...shared,
    palette: paletteFor(mode),
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':focus-visible': {
            outline: `2px solid ${mode === 'dark' ? tokens.brand[400] : tokens.brand[600]}`,
            outlineOffset: '2px',
          },
          'html, body': { height: '100%' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.md,
            paddingInline: 20,
            paddingBlock: 10,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: 'var(--mui-palette-divider)',
          },
          head: ({ theme }) => ({
            fontWeight: 600,
            letterSpacing: '0.02em',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.paper,
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
    },
  });
  return responsiveFontSizes(base);
}
