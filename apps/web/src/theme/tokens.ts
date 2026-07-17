export const tokens = {
  brand: {
    50: '#eef4ff',
    100: '#dde7ff',
    200: '#b8ceff',
    300: '#7ea7ff',
    400: '#4c85ff',
    500: '#2a67f5',
    600: '#1e4ee0',
    700: '#193fc0',
    800: '#183694',
    900: '#152c74',
  },
  severity: {
    none: { fg: '#0f7a3d', bg: '#e7f6ec', border: '#b7e0c5' },
    low: { fg: '#8a6d0f', bg: '#fff5cc', border: '#f0dc7c' },
    medium: { fg: '#a24a06', bg: '#ffe8d1', border: '#f4b78d' },
    high: { fg: '#a11a1a', bg: '#ffdada', border: '#f19c9c' },
    critical: { fg: '#ffffff', bg: '#7f1010', border: '#5b0a0a' },
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    pill: 999,
  },
  space: {
    px: 1,
    0.5: 4,
    1: 8,
    1.5: 12,
    2: 16,
    3: 24,
    4: 32,
    6: 48,
    8: 64,
    12: 96,
  },
  motion: {
    fast: '120ms',
    base: '200ms',
    slow: '360ms',
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
} as const;

export type SeverityKey = keyof typeof tokens.severity;
