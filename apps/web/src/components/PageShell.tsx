import { Container, type ContainerProps } from '@mui/material';
import type { ReactNode } from 'react';

const DEFAULT_MAX_PX = 1360;

export function PageShell({
  children,
  maxWidth,
  disableGutters,
  sx,
}: {
  children: ReactNode;
  maxWidth?: ContainerProps['maxWidth'];
  disableGutters?: boolean;
  sx?: ContainerProps['sx'];
}) {
  const useCustomWidth = maxWidth === undefined;
  return (
    <Container
      component="main"
      id="main-content"
      maxWidth={useCustomWidth ? false : maxWidth}
      disableGutters={disableGutters}
      sx={{
        pt: { xs: 3, md: 5 },
        pb: { xs: 6, md: 10 },
        ...(useCustomWidth ? { maxWidth: DEFAULT_MAX_PX, mx: 'auto' } : {}),
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}
