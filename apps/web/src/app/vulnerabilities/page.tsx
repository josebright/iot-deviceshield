'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';

function nvdUrl(cveId: string): string {
  return `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveId)}`;
}
import type { Vulnerability, VulnerabilityResponse } from '@iot-deviceshield/types';
import { apiClient } from '@/lib/api';
import { PageShell } from '@/components/PageShell';
import { SkeletonTable } from '@/components/skeletons';
import { RetryError } from '@/components/RetryError';
import { EmptyState } from '@/components/EmptyState';
import { SeverityBadge, ScorePill } from '@/components/SeverityBadge';

const COLUMN_HELP: Record<string, string> = {
  Likelihood: 'CVSS exploitability sub-score — how attackable the flaw is.',
  Impact: 'CVSS impact sub-score — the technical damage if exploited.',
  Risk: 'CVSS base score — combined severity 0–10.',
};

function Summary({ items }: { items: Vulnerability[] }) {
  const counts = useMemo(() => {
    const buckets: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
    for (const v of items) {
      const key = (v.metrics[0]?.baseSeverity ?? 'none').toLowerCase();
      buckets[key in buckets ? key : 'none'] = (buckets[key in buckets ? key : 'none'] ?? 0) + 1;
    }
    return buckets;
  }, [items]);

  const total = items.length;
  const order = ['critical', 'high', 'medium', 'low', 'none'] as const;
  const nonZero = order.filter((k) => (counts[k] ?? 0) > 0);
  const shown = nonZero.length > 0 ? nonZero : (['none'] as const);

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 4 }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="baseline">
          <Typography variant="h2" sx={{ fontWeight: 700, lineHeight: 1 }}>
            {total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total === 1 ? 'finding' : 'findings'}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          gap={{ xs: 1, md: 1.5 }}
          flexWrap="wrap"
          alignItems="center"
          role="list"
          aria-label="Severity summary"
        >
          {shown.map((k) => (
            <Stack
              key={k}
              direction="row"
              spacing={0.75}
              alignItems="center"
              role="listitem"
              sx={{ minHeight: 28 }}
            >
              <SeverityBadge severity={k} showLabel />
              <Typography variant="body2" fontWeight={600}>
                {counts[k] ?? 0}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function MatchBanner({ response }: { response: VulnerabilityResponse }) {
  if (response.matchSource === 'cpe') {
    return null;
  }
  return (
    <Alert severity="info" variant="outlined">
      Approximate match — no high-confidence CPE identifier was resolved for this device, so results
      were fetched by keyword search. Precision may vary.
    </Alert>
  );
}

function DetailsContent({ deviceName }: { deviceName: string | null }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<VulnerabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!deviceName) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    (async () => {
      try {
        const data = await apiClient.getVulnerabilities(deviceName);
        if (!cancelled) {
          setResponse(data);
        }
      } catch (error) {
        console.error('Failed to load vulnerabilities', error);
        if (!cancelled) {
          setErrorMessage('Unable to load vulnerabilities. Please try again shortly.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceName, attempt]);

  const items = response?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter((v) => {
      return (
        v.cveId?.toLowerCase().includes(q) ||
        v.vulnerability?.toLowerCase().includes(q) ||
        v.affectedSystem?.toLowerCase().includes(q) ||
        v.threats?.toLowerCase().includes(q) ||
        v.impact?.toLowerCase().includes(q) ||
        v.recommendations?.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  return (
    <PageShell>
      <Stack spacing={{ xs: 4, md: 5 }}>
        <Stack spacing={2}>
          <Breadcrumbs aria-label="Breadcrumb">
            <Link href="/" style={{ color: 'inherit' }}>
              <Typography variant="body2" color="text.secondary">
                Home
              </Typography>
            </Link>
            <Typography variant="body2" color="text.primary">
              {deviceName ?? 'No device selected'}
            </Typography>
          </Breadcrumbs>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'flex-end' }}
            spacing={2}
          >
            <Stack spacing={1}>
              <Typography variant="h1">Risk assessment</Typography>
              <Typography variant="body2" color="text.secondary">
                {deviceName
                  ? `Published CVEs for ${deviceName}, enriched with AI-assisted guidance.`
                  : 'Pick a device on the home page to see its findings.'}
              </Typography>
              {response ? (
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={response.matchSource === 'cpe' ? 'CPE match' : 'Keyword match'}
                    color={response.matchSource === 'cpe' ? 'success' : 'default'}
                    variant="outlined"
                  />
                  {response.cached ? (
                    <Chip size="small" label="From cache" variant="outlined" />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              size="small"
            >
              Change device
            </Button>
          </Stack>
        </Stack>

        {!deviceName ? (
          <EmptyState
            title="No device selected"
            description="Return home and pick a category and device to see its risk assessment."
            action={{ label: 'Choose a device', href: '/' }}
          />
        ) : loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : errorMessage ? (
          <RetryError
            title="Assessment failed to load"
            description={errorMessage}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : !response || response.items.length === 0 ? (
          <EmptyState
            title="No findings yet"
            description="No CVEs matched the selected device in the NIST NVD catalogue. Try another device or refresh later."
            action={{ label: 'Try another device', href: '/' }}
          />
        ) : (
          <>
            <MatchBanner response={response} />
            <Summary items={response.items} />

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search CVE, vulnerability, system, threat…"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}
                  aria-label="Search vulnerabilities"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: query ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => setQuery('')}
                          >
                            <CloseOutlined fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{ maxWidth: { sm: 420 } }}
                />
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary" aria-live="polite">
                  {filtered.length} {filtered.length === 1 ? 'finding' : 'findings'}
                  {query ? ` matching “${query}”` : ''}
                </Typography>
              </Stack>

              <TableContainer sx={{ maxWidth: '100%' }}>
                <Table stickyHeader aria-label="Vulnerabilities">
                  <TableHead>
                    <TableRow>
                      <TableCell scope="col" sx={{ minWidth: 150 }}>
                        CVE
                      </TableCell>
                      <TableCell scope="col" sx={{ minWidth: 120 }}>
                        Severity
                      </TableCell>
                      <TableCell scope="col" sx={{ minWidth: 200 }}>
                        Vulnerability
                      </TableCell>
                      <TableCell scope="col" sx={{ minWidth: 160 }}>
                        Affected systems
                      </TableCell>
                      {(['Likelihood', 'Impact', 'Risk'] as const).map((k) => (
                        <TableCell key={k} scope="col" align="center" sx={{ minWidth: 100 }}>
                          <Tooltip title={COLUMN_HELP[k]} arrow>
                            <Box
                              component="span"
                              sx={{ borderBottom: '1px dotted', cursor: 'help' }}
                            >
                              {k}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      ))}
                      <TableCell scope="col" sx={{ minWidth: 260 }}>
                        Recommendation
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((item, index) => {
                      const metric = item.metrics[0];
                      const severity = metric?.baseSeverity;
                      const rowNumber = page * rowsPerPage + index + 1;
                      return (
                        <TableRow key={item.cveId ?? `${rowNumber}`} hover>
                          <TableCell scope="row">
                            {item.cveId ? (
                              <Tooltip title={`Open ${item.cveId} on NIST NVD in a new tab`} arrow>
                                <Box
                                  component="a"
                                  href={nvdUrl(item.cveId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                    '&:focus-visible': {
                                      outline: '2px solid',
                                      outlineColor: 'primary.main',
                                      outlineOffset: 2,
                                      borderRadius: 1,
                                    },
                                  }}
                                >
                                  {item.cveId}
                                  <OpenInNewOutlined sx={{ fontSize: '0.9rem' }} aria-hidden />
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <SeverityBadge severity={severity} />
                          </TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.vulnerability || '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.threats || '—'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.affectedSystem || '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <ScorePill
                              score={metric?.exploitabilityScore}
                              severity={severity}
                              caption="0–10"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <ScorePill
                              score={metric?.impactScore}
                              severity={severity}
                              caption="0–10"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <ScorePill
                              score={metric?.baseScore}
                              severity={severity}
                              caption="0–10"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.recommendations || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filtered.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Paper>
          </>
        )}
      </Stack>
    </PageShell>
  );
}

export default function Details() {
  const searchParams = useSearchParams();
  const deviceName = searchParams.get('name');
  return (
    <Suspense fallback={<SkeletonTable />}>
      <DetailsContent deviceName={deviceName} />
    </Suspense>
  );
}
