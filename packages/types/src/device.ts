import type { CategorySummary } from './category';

export interface Device {
  id: number;
  slug: string;
  name: string;
  vendor: string | null;
  product: string | null;
  cpeName: string | null;
  cpeConfidence: number | null;
  category?: CategorySummary;
}

export interface DeviceSummary {
  id: number;
  slug: string;
  name: string;
}
