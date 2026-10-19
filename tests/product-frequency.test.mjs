import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { rankProductFrequency, sortProductsByFrequency } = mods['domain/productFrequency'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('rankProductFrequency ignores deleted and null productId', () => {
  const ranked = rankProductFrequency([
    { productId: 'a', deletedAt: null },
    { productId: 'a', deletedAt: null },
    { productId: 'b', deletedAt: null },
    { productId: 'a', deletedAt: '2026-01-01' },
    { productId: null, deletedAt: null },
  ]);
  assert.deepEqual(ranked, [
    { productId: 'a', count: 2 },
    { productId: 'b', count: 1 },
  ]);
});

test('sortProductsByFrequency puts frequent first', () => {
  const freq = new Map([
    ['p2', 5],
    ['p1', 1],
  ]);
  const sorted = sortProductsByFrequency(
    [
      { id: 'p1', name: 'Alpha' },
      { id: 'p2', name: 'Beta' },
      { id: 'p3', name: 'Gamma' },
    ],
    freq,
  );
  assert.deepEqual(
    sorted.map((p) => p.id),
    ['p2', 'p1', 'p3'],
  );
});

test('listFrequentProducts ranks by diary logs', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const oats = repo.createProduct({
    name: 'Oats',
    energyKcal: 100,
    proteinG: 10,
    fatG: 2,
    carbG: 20,
  });
  const milk = repo.createProduct({
    name: 'Milk',
    energyKcal: 60,
    proteinG: 3,
    fatG: 3,
    carbG: 5,
  });
  for (let i = 0; i < 3; i++) {
    repo.addEntryFromProduct({
      productId: oats.id,
      dateLocal: '2026-10-17',
      meal: 'breakfast',
      grams: 50,
    });
  }
  repo.addEntryFromProduct({
    productId: milk.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 200,
  });
  const freq = repo.listFrequentProducts(10);
  assert.equal(freq[0].id, oats.id);
  assert.equal(freq[1].id, milk.id);

  const linked = repo.linkBarcodeToProduct(oats.id, '4601234567890');
  assert.equal(linked.barcode, '4601234567890');
  assert.equal(repo.findProductByBarcode('4601234567890')?.id, oats.id);
});
