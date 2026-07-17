import {
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export function SkeletonHomeForm() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Skeleton variant="text" width="60%" height={48} />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="rounded" height={44} />
      <Skeleton variant="rounded" height={44} />
      <Skeleton variant="rounded" height={44} />
    </Stack>
  );
}

export function SkeletonTable({ rows = 5, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Loading vulnerabilities">
        <TableHead>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton variant="text" width={80} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
