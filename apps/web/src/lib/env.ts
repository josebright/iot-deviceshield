const DEFAULT_API_URL = 'http://localhost:3000/v1';

function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw || raw.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[env] NEXT_PUBLIC_API_URL is not set; falling back to ' +
          DEFAULT_API_URL +
          '. Set it in your deploy environment.',
      );
    }
    return DEFAULT_API_URL;
  }
  return raw.replace(/\/+$/, '');
}

export const env = {
  get apiUrl(): string {
    return resolveApiUrl();
  },
} as const;
