import type { DeviceSummary } from './device';

export interface Category {
  id: number;
  slug: string;
  name: string;
  devices?: DeviceSummary[];
}

export interface CategorySummary {
  id: number;
  slug: string;
  name: string;
}
