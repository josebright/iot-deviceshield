import type { Category, Vulnerability } from '@iot-deviceshield/types';
import { env } from './env';

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${env.apiUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // response body was not JSON — fall back to statusText
    }
    throw new ApiError(message, response.status, path);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  getCategories: (): Promise<Category[]> => request<Category[]>('/category'),
  getVulnerabilities: (deviceName: string): Promise<Vulnerability[]> =>
    request<Vulnerability[]>(`/vulnerabilities?keywordSearch=${encodeURIComponent(deviceName)}`),
};

export { ApiError };
