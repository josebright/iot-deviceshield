import type { CategorySummary } from './category';

export interface Device {
  id: number;
  name: string;
  category?: CategorySummary;
}

export interface DeviceSummary {
  id: number;
  name: string;
}
