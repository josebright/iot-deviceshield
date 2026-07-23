import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CatalogDeviceSchema = z.object({
  slug: z.string().min(1).max(80).regex(slugPattern, 'slug must be kebab-case'),
  name: z.string().min(1).max(120),
  vendor: z.string().min(1).max(80),
  product: z.string().min(1).max(120),
  cpeHint: z.string().min(1).max(200).optional(),
});

export const CatalogCategorySchema = z.object({
  slug: z.string().min(1).max(60).regex(slugPattern, 'slug must be kebab-case'),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(240).optional(),
  devices: z.array(CatalogDeviceSchema).min(1).max(50),
});

export const CatalogSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().min(1),
  categories: z.array(CatalogCategorySchema).min(1).max(30),
});

export type CatalogDevice = z.infer<typeof CatalogDeviceSchema>;
export type CatalogCategory = z.infer<typeof CatalogCategorySchema>;
export type Catalog = z.infer<typeof CatalogSchema>;

export function parseCatalog(input: unknown): Catalog {
  return CatalogSchema.parse(input);
}
