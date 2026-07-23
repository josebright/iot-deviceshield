import { loadCatalog } from './loader';
import { CatalogSchema } from './schema';

describe('catalog schema + fixture', () => {
  it('parses the bundled catalog.json', () => {
    const { catalog, sourceVersion } = loadCatalog();
    expect(sourceVersion).toMatch(/^[0-9a-f]{16}$/);
    expect(catalog.categories.length).toBeGreaterThan(0);
  });

  it('rejects non-kebab-case slugs', () => {
    const bad = {
      version: '1',
      updatedAt: '1',
      categories: [
        {
          slug: 'Bad Slug',
          name: 'x',
          devices: [{ slug: 'ok-slug', name: 'x', vendor: 'v', product: 'p' }],
        },
      ],
    };
    expect(() => CatalogSchema.parse(bad)).toThrow();
  });

  it('rejects duplicate structure via schema (empty categories)', () => {
    const bad = { version: '1', updatedAt: '1', categories: [] };
    expect(() => CatalogSchema.parse(bad)).toThrow();
  });
});
