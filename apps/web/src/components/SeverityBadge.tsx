import { Box, Chip, Stack, Typography } from '@mui/material';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { tokens, type SeverityKey } from '@/theme/tokens';

function normalize(input: string | null | undefined): SeverityKey {
  const v = (input ?? 'none').toLowerCase();
  if (v === 'critical' || v === 'high' || v === 'medium' || v === 'low' || v === 'none') {
    return v;
  }
  return 'none';
}

const ICONS: Record<SeverityKey, typeof ErrorOutlineOutlined> = {
  critical: ErrorOutlineOutlined,
  high: ReportProblemOutlined,
  medium: WarningAmberOutlined,
  low: InfoOutlined,
  none: CheckCircleOutline,
};

const LABELS: Record<SeverityKey, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
};

export function SeverityBadge({
  severity,
  size = 'small',
  showLabel = true,
}: {
  severity: string | null | undefined;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}) {
  const key = normalize(severity);
  const t = tokens.severity[key];
  const Icon = ICONS[key];
  const label = LABELS[key];

  return (
    <Chip
      icon={<Icon fontSize="small" aria-hidden />}
      label={showLabel ? label : undefined}
      size={size}
      variant="outlined"
      sx={{
        color: t.fg,
        backgroundColor: t.bg,
        borderColor: t.border,
        '& .MuiChip-icon': { color: t.fg, marginLeft: 0.5 },
      }}
      aria-label={`Severity: ${label}`}
    />
  );
}

export function ScorePill({
  score,
  severity,
  caption,
}: {
  score: number | string | null | undefined;
  severity: string | null | undefined;
  caption?: string;
}) {
  const key = normalize(severity);
  const t = tokens.severity[key];
  const value = score ?? '—';
  return (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 56 }}>
      <Box
        sx={{
          borderRadius: tokens.radius.pill,
          paddingInline: 1.25,
          paddingBlock: 0.25,
          color: t.fg,
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          fontWeight: 700,
          fontSize: '0.875rem',
          minWidth: 44,
          textAlign: 'center',
        }}
        aria-label={caption ? `${caption}: ${value}` : `Score ${value}`}
      >
        {value}
      </Box>
      {caption ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          {caption}
        </Typography>
      ) : null}
    </Stack>
  );
}
