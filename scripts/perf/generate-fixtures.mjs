#!/usr/bin/env node
/**
 * Synthetic StoreSnapshot fixtures for quality baseline (no real health data).
 * Usage: node scripts/perf/generate-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSrcModules } from '../../tests/loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(root, 'scripts/perf/fixtures');
mkdirSync(outDir, { recursive: true });

const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

const SIZES = [
  { id: 'D0', entries: 0, products: 0 },
  { id: 'D100', entries: 100, products: 20 },
  { id: 'D1k', entries: 1000, products: 100 },
  { id: 'D10k', entries: 10_000, products: 500 },
];

function dateOffset(i) {
  const day = (i % 365) + 1;
  const d = new Date(Date.UTC(2025, 0, day));
  return d.toISOString().slice(0, 10);
}

function build({ id, entries, products }) {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const productIds = [];
  for (let i = 0; i < products; i++) {
    const p = repo.createProduct({
      name: `Synth Product ${i}`,
      energyKcal: 100 + (i % 200),
      proteinG: 5 + (i % 20),
      fatG: 2 + (i % 10),
      carbG: 10 + (i % 30),
    });
    productIds.push(p.id);
  }
  if (productIds.length === 0 && entries > 0) {
    const p = repo.createProduct({
      name: 'Synth Solo',
      energyKcal: 120,
      proteinG: 10,
      fatG: 3,
      carbG: 12,
    });
    productIds.push(p.id);
  }
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  for (let i = 0; i < entries; i++) {
    const pid = productIds[i % productIds.length];
    repo.addEntryFromProduct({
      productId: pid,
      dateLocal: dateOffset(i),
      meal: meals[i % 4],
      grams: 50 + (i % 150),
    });
  }
  const snap = repo.toSnapshot();
  const path = join(outDir, `${id}.json`);
  writeFileSync(path, JSON.stringify(snap));
  const bytes = Buffer.byteLength(JSON.stringify(snap));
  return { id, entries: snap.entries.length, products: snap.products.length, bytes, path };
}

const summary = SIZES.map(build);
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), fixtures: summary }, null, 2));
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({ fixtures: summary }, null, 2));
