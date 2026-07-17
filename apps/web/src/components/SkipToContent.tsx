'use client';

import { Box } from '@mui/material';

export function SkipToContent() {
  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'absolute',
        left: -9999,
        top: 0,
        px: 2,
        py: 1,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        zIndex: (t) => t.zIndex.snackbar,
        borderRadius: '0 0 8px 0',
        '&:focus': { left: 0 },
      }}
    >
      Skip to content
    </Box>
  );
}
