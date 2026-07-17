import { Box, Button, Stack, Typography, type SvgIconTypeMap } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon = InfoOutlined,
  title,
  description,
  action,
}: {
  icon?: OverridableComponent<SvgIconTypeMap>;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <Stack
      alignItems="center"
      spacing={2}
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: 'center',
        border: (t) => `1px dashed ${t.palette.divider}`,
        borderRadius: 2,
        color: 'text.secondary',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <Icon />
      </Box>
      <Typography variant="h3" sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" sx={{ maxWidth: 44 * 8 }}>
          {description}
        </Typography>
      ) : null}
      {action ? (
        action.href ? (
          <Button variant="contained" href={action.href}>
            {action.label}
          </Button>
        ) : (
          <Button variant="contained" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </Stack>
  );
}
