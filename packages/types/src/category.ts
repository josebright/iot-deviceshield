import type { DeviceSummary } from './device';

export interface Category {
  id: number;
  name: string;
  devices?: DeviceSummary[];
}

export interface CategorySummary {
  id: number;
  name: string;
}
