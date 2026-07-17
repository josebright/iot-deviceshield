'use client';

import { createContext, useContext } from 'react';
import type { PaletteMode } from '@mui/material';

export interface ColorModeContextValue {
  mode: PaletteMode;
  toggle: () => void;
  set: (mode: PaletteMode) => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'dark',
  toggle: () => {},
  set: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
