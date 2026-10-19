import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { COMMON_FOOD_CATALOG, mergeCommonFoodCatalog, commonFoodAliases } =
  mods['domain/commonFoodCatalog'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { unifiedFoodSearch } = mods['domain/unifiedFoodSearch'];

test('common catalog has stable seed ids and non-negative macros', () => {
  assert.ok(COMMON_FOOD_CATALOG.length >= 40);
  const ids = new Set();
  for (const f of COMMON_FOOD_CATALOG) {
    assert.ok(f.id.startsWith('seed:'));
    assert.equal(ids.has(f.id), false);
    ids.add(f.id);
    assert.ok(Number.isFinite(f.energyKcal) && f.energyKcal >= 0);
    assert.ok(Number.isFinite(f.proteinG) && f.proteinG >= 0);
    assert.ok(Number.isFinite(f.fatG) && f.fatG >= 0);
    assert.ok(Number.isFinite(f.carbG) && f.carbG >= 0);
  }
});

test('repo boots with common foods; merge is idempotent', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const n = repo.listProducts().filter((p) => p.id.startsWith('seed:')).length;
  assert.equal(n, COMMON_FOOD_CATALOG.length);
  const map = new Map(repo.listProducts().map((p) => [p.id, p]));
  assert.equal(mergeCommonFoodCatalog(map), 0);
});

test('search finds seed by alias without barcode', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const products = repo.listProducts();
  assert.ok(commonFoodAliases('seed:cottage-5').includes('творог'));
  const hits = unifiedFoodSearch({ query: 'творог', products, recipes: [], recent: [] });
  assert.ok(hits.some((h) => h.kind === 'product' && h.product.id === 'seed:cottage-5'));
  const chicken = unifiedFoodSearch({ query: 'грудка', products, recipes: [], recent: [] });
  assert.ok(chicken.some((h) => h.kind === 'product' && h.product.id === 'seed:chicken-breast'));
});

test('user soft-delete of seed is not revived on merge', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  // Soft-delete via snapshot round-trip: mark deletedAt on seed.
  const snap = JSON.parse(repo.exportAll());
  const egg = snap.products.find((p) => p.id === 'seed:egg');
  assert.ok(egg);
  egg.deletedAt = '2026-10-19T12:00:00.000Z';
  const repo2 = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snap });
  assert.equal(
    repo2.listProducts().some((p) => p.id === 'seed:egg'),
    false,
  );
});
