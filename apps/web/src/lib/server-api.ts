import type { Category } from '@iot-deviceshield/types';

const DEFAULT_INTERNAL = 'http://api:3000/v1';
const DEFAULT_PUBLIC = 'http://localhost:3000/v1';

function serverApiUrl(): string {
  const internal = process.env.INTERNAL_API_URL;
  if (internal && internal.trim() !== '') {
    return internal.replace(/\/+$/, '');
  }
  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (pub && pub.trim() !== '') {
    return pub.replace(/\/+$/, '');
  }
  return DEFAULT_INTERNAL || DEFAULT_PUBLIC;
}

export async function fetchCategoriesServer(): Promise<Category[]> {
  const url = `${serverApiUrl()}/category`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`categories fetch failed: ${res.status}`);
  }
  return (await res.json()) as Category[];
}
