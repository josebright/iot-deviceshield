'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import type { CvssSeverity, Vulnerability } from '@iot-deviceshield/types';
import { apiClient } from '@/lib/api';
import styles from '../page.module.css';

const SEVERITY_COLORS: Record<string, string> = {
  none: 'green',
  low: 'khaki',
  medium: 'orange',
  high: 'red',
  critical: 'darkred',
};

const SEVERITY_LEGEND: { label: string; color: string }[] = [
  { label: 'None', color: SEVERITY_COLORS.none },
  { label: 'Low', color: SEVERITY_COLORS.low },
  { label: 'Medium', color: SEVERITY_COLORS.medium },
  { label: 'High', color: SEVERITY_COLORS.high },
  { label: 'Critical', color: SEVERITY_COLORS.critical },
];

function getColorForSeverity(severity: CvssSeverity | string): string {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? 'primary';
}

function SeverityGuide() {
  return (
    <div className={styles.severityGuide}>
      <Grid container>
        {SEVERITY_LEGEND.map((severity) => (
          <Grid
            item
            key={severity.label}
            xs={2}
            className={styles.severityColor}
            style={{ backgroundColor: severity.color }}
          >
            {severity.label}
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

function DetailsContent({ deviceName }: { deviceName: string | null }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [vulnerabilityData, setVulnerabilityData] = useState<Vulnerability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceName) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.getVulnerabilities(deviceName);
        if (!cancelled) {
          setVulnerabilityData(data);
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
  }, [deviceName]);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <main className={styles.submain}>
        <CircularProgress />
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className={styles.submain}>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className={styles.submain}>
      <div>
        <Button className={styles.backButton}>
          <Link href="/">
            <Grid container spacing={1} direction="row" alignItems="center" justifyContent="center">
              <Grid item style={{ marginTop: '0.5rem' }}>
                <ArrowBack />
              </Grid>
              <Grid item>Back</Grid>
            </Grid>
          </Link>
        </Button>
        <h1>Risk Assessment Details</h1>
        <br />
        <SeverityGuide />
        <br />
        <TableContainer component={Paper}>
          <Table stickyHeader aria-label="vulnerability risk assessment table">
            <TableHead>
              <TableRow>
                <TableCell className={styles.tableHeader}>S/N</TableCell>
                <TableCell className={styles.tableHeader}>Affected Systems</TableCell>
                <TableCell className={styles.tableHeader}>Threats</TableCell>
                <TableCell className={styles.tableHeader}>Vulnerabilities</TableCell>
                <TableCell className={styles.tableHeader}>Likelihood Score</TableCell>
                <TableCell className={styles.tableHeader}>Impact</TableCell>
                <TableCell className={styles.tableHeader}>Impact Score</TableCell>
                <TableCell className={styles.tableHeader}>Risk Score</TableCell>
                <TableCell className={styles.tableHeader}>Recommendations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vulnerabilityData
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => {
                  const metric = item.metrics[0];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className={styles.tableCell}>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell className={styles.tableCell}>{item.affectedSystem}</TableCell>
                      <TableCell className={styles.tableCell}>{item.threats}</TableCell>
                      <TableCell className={styles.tableCell}>{item.vulnerability}</TableCell>
                      <TableCell className={styles.tableCell}>
                        {metric ? (
                          <Typography
                            variant="body1"
                            sx={{
                              backgroundColor: getColorForSeverity(metric.availabilityImpact),
                              borderRadius: '20px',
                              padding: '10px',
                              color: 'white',
                              textAlign: 'center',
                            }}
                          >
                            {metric.exploitabilityScore}
                          </Typography>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className={styles.tableCell}>{item.impact}</TableCell>
                      <TableCell className={styles.tableCell}>
                        {metric ? (
                          <Typography
                            variant="body1"
                            sx={{
                              backgroundColor: getColorForSeverity(metric.integrityImpact),
                              borderRadius: '20px',
                              padding: '10px',
                              color: 'white',
                              textAlign: 'center',
                            }}
                          >
                            {metric.impactScore}
                          </Typography>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className={styles.tableCell}>
                        {metric ? (
                          <Typography
                            variant="body1"
                            sx={{
                              backgroundColor: getColorForSeverity(metric.baseSeverity),
                              borderRadius: '20px',
                              padding: '10px',
                              color: 'white',
                              textAlign: 'center',
                            }}
                          >
                            {metric.baseScore}
                          </Typography>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className={styles.tableCell}>{item.recommendations}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={vulnerabilityData?.length ?? 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            className={styles.tablePagination}
          />
        </TableContainer>
      </div>
    </main>
  );
}

export default function Details() {
  const searchParams = useSearchParams();
  const deviceName = searchParams.get('name');
  return (
    <main className={styles.submain}>
      <Suspense fallback={<CircularProgress />}>
        <DetailsContent deviceName={deviceName} />
      </Suspense>
    </main>
  );
}
