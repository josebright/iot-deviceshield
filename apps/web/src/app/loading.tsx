import { CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <CircularProgress aria-label="Loading" />
    </main>
  );
}
