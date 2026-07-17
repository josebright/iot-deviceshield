import { Box } from '@mui/material';

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: '30%',
        display: 'grid',
        placeItems: 'center',
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
        color: 'primary.contrastText',
        fontWeight: 800,
        fontSize: size * 0.5,
        letterSpacing: '-0.03em',
        boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 6px 16px rgba(30, 78, 224, 0.25)',
      }}
    >
      D
    </Box>
  );
}
