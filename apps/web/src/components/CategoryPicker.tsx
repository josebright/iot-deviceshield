'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import type { Category, DeviceSummary } from '@iot-deviceshield/types';

interface Props {
  categories: Category[];
}

export function CategoryPicker({ categories }: Props) {
  const [category, setCategory] = useState<string>('');
  const [device, setDevice] = useState<string>('');
  const [devices, setDevices] = useState<DeviceSummary[]>([]);

  const onCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.value;
    setCategory(selected);
    const found = categories.find((c) => c.name === selected);
    setDevices(found?.devices ?? []);
    setDevice('');
  };

  return (
    <Stack
      component="form"
      onSubmit={(event) => event.preventDefault()}
      spacing={2}
      sx={{ maxWidth: 480 }}
    >
      <TextField
        select
        fullWidth
        label="Category"
        value={category}
        onChange={onCategoryChange}
        helperText="Groups of smart-home devices"
      >
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.name}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Device"
        value={device}
        onChange={(event) => setDevice(event.target.value)}
        disabled={!devices.length}
        helperText={devices.length ? 'The exact model to assess' : 'Pick a category first'}
      >
        {devices.map((d) => (
          <MenuItem key={d.id} value={d.name}>
            {d.name}
          </MenuItem>
        ))}
      </TextField>

      <Box>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardOutlined />}
          disabled={!device}
          component={Link}
          href={`/vulnerabilities?name=${encodeURIComponent(device)}`}
          aria-label={device ? `View risk assessment for ${device}` : 'Pick a device to continue'}
        >
          View risk assessment
        </Button>
      </Box>
    </Stack>
  );
}
