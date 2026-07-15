'use client';

import { useEffect } from 'react';
import { Button } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1>Something went wrong</h1>
      <p>The dashboard hit an unexpected error. If this keeps happening, please contact support.</p>
      {error.digest ? <p style={{ opacity: 0.6 }}>Reference: {error.digest}</p> : null}
      <Button variant="contained" onClick={() => reset()} style={{ marginTop: '1rem' }}>
        Try again
      </Button>
    </main>
  );
}
