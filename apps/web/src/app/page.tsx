'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Button, CircularProgress, MenuItem, TextField } from '@mui/material';
import type { Category, DeviceSummary } from '@iot-deviceshield/types';
import { apiClient } from '@/lib/api';
import styles from './page.module.css';

export default function Home(): JSX.Element {
  const [categoryData, setCategoryData] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [device, setDevice] = useState<string>('');
  const [devices, setDevices] = useState<DeviceSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.getCategories();
        if (!cancelled) {
          setCategoryData(data);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
        if (!cancelled) {
          setErrorMessage('Unable to load categories. Please try again shortly.');
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
  }, []);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.value;
    setCategory(selected);
    const found = categoryData?.find((c) => c.name === selected);
    setDevices(found?.devices ?? []);
    setDevice('');
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDevice(event.target.value);
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <CircularProgress />
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className={styles.main}>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div>
        <div className={styles.description}>
          <div>
            <h1 className={styles.title}>Smart Home Risk Assessment</h1>
            <br />
            <p>
              Smart home risk assessments are essential to identify hazards, threats,
              vulnerabilities and risks that may potentially cause harm to our devices.
            </p>
          </div>
        </div>
        <div className={styles.center}>
          <Box
            component="form"
            sx={{ '& .MuiTextField-root': { m: 1, width: '30ch' } }}
            noValidate
            autoComplete="off"
          >
            <div>
              <TextField
                id="outlined-select-category"
                select
                label="Select Category"
                value={category}
                onChange={handleCategoryChange}
                className={styles.textfield}
              >
                {categoryData?.map((c) => (
                  <MenuItem key={c.id} value={c.name}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div>
              <TextField
                id="outlined-select-device"
                select
                label="Select Device"
                value={device}
                onChange={handleDeviceChange}
                disabled={!devices.length}
                className={styles.textfield}
              >
                {devices.map((d) => (
                  <MenuItem key={d.id} value={d.name}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div style={{ margin: '2rem', cursor: 'pointer' }}>
              <Button disabled={!device} color="primary" className={styles.SubmitButton}>
                <Link href={{ pathname: '/vulnerabilities', query: { name: device } }}>
                  GET DETAILS
                </Link>
              </Button>
            </div>
          </Box>
        </div>
      </div>
    </main>
  );
}
