const STORAGE_KEY = 'iot-deviceshield.client-id';

export function getClientId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && /^[0-9a-f-]{8,64}$/i.test(existing)) {
      return existing;
    }
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}
