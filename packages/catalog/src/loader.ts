import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCatalog, type Catalog } from './schema';

const CATALOG_PATHS = [
  join(__dirname, 'catalog.json'),
  join(__dirname, '..', 'src', 'catalog.json'),
];

export interface LoadedCatalog {
  catalog: Catalog;
  sourceVersion: string;
}

export function loadCatalog(): LoadedCatalog {
  let raw: string | null = null;
  for (const p of CATALOG_PATHS) {
    try {
      raw = readFileSync(p, 'utf-8');
      break;
    } catch {
      // try next path
    }
  }
  if (raw === null) {
    throw new Error(`catalog.json not found. Looked in: ${CATALOG_PATHS.join(', ')}`);
  }
  const parsed = parseCatalog(JSON.parse(raw));
  const sourceVersion = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return { catalog: parsed, sourceVersion };
}
