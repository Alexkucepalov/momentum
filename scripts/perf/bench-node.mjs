#!/usr/bin/env node
/**
 * Node-only performance microbenches (not device / emulator).
 * Usage: node scripts/perf/bench-node.mjs
 */
import { loadSrcModules } from '../../tests/loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { unifiedFoodSearch } = mods['domain/unifiedFoodSearch'];

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function bench(label, n, fn) {
  const times = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return {
    label,
    n,
    p50_ms: Number(percentile(times, 50).toFixed(3)),
    p95_ms: Number(percentile(times, 95).toFixed(3)),
    max_ms: Number(times[times.length - 1].toFixed(3)),
  };
}

function seedRepo(entryCount, productCount) {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const ids = [];
  for (let i = 0; i < productCount; i++) {
    ids.push(
      repo.createProduct({
        name: `Bench Food ${i} овсянка`,
        energyKcal: 100 + (i % 50),
        proteinG: 8,
        fatG: 2,
        carbG: 15,
      }).id,
    );
  }
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  for (let i = 0; i < entryCount; i++) {
    const day = 1 + (i % 28);
    repo.addEntryFromProduct({
      productId: ids[i % ids.length],
      dateLocal: `2026-01-${String(day).padStart(2, '0')}`,
      meal: meals[i % 4],
      grams: 100,
    });
  }
  return repo;
}

const results = {
  env: 'node',
  node: process.version,
  measuredAt: new Date().toISOString(),
  note: 'Not Android emulator or physical device',
  rows: [],
};

for (const { entries, products, tag } of [
  { entries: 100, products: 50, tag: 'D100' },
  { entries: 1000, products: 200, tag: 'D1k' },
  { entries: 10_000, products: 500, tag: 'D10k' },
]) {
  const build = bench(`seed ${tag}`, 3, () => seedRepo(entries, products));
  results.rows.push(build);
  const repo = seedRepo(entries, products);
  const snap = repo.toSnapshot();
  results.rows.push(
    bench(`serialize ${tag}`, 20, () => JSON.stringify(snap)),
  );
  results.rows.push(
    bench(`dailyTotals ${tag}`, 50, () => repo.dailyTotals('2026-01-15')),
  );
  const productsList = repo.listProducts();
  const recipes = repo.listRecipes();
  const recent = repo.listRecentEntries(20);
  results.rows.push(
    bench(`unifiedSearch "ов" ${tag}`, 30, () =>
      unifiedFoodSearch({ query: 'ов', products: productsList, recipes, recent, limit: 40 }),
    ),
  );
  results.rows.push({
    label: `snapshot bytes ${tag}`,
    bytes: Buffer.byteLength(JSON.stringify(snap)),
    entries: snap.entries.length,
    products: snap.products.length,
  });
}

console.log(JSON.stringify(results, null, 2));
