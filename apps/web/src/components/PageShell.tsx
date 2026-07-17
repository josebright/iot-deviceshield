import { Container, type ContainerProps } from '@mui/material';
import type { ReactNode } from 'react';

export function PageShell({
  children,
  maxWidth = 'lg',
  disableGutters,
  sx,
}: {
  children: ReactNode;
  maxWidth?: ContainerProps['maxWidth'];
  disableGutters?: boolean;
  sx?: ContainerProps['sx'];
}) {
  return (
    <Container
      component="main"
      id="main-content"
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 6, md: 10 }, ...sx }}
    >
      {children}
    </Container>
  );
}
