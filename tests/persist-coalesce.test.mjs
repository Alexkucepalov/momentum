import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

test('persist hook coalesces burst notify into one write', async () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  let writes = 0;
  repo.setPersistHook(() => {
    writes += 1;
  });

  const product = repo.createProduct({
    name: 'Oats',
    energyKcal: 370,
    proteinG: 13,
    fatG: 7,
    carbG: 60,
    source: 'user',
  });

  for (let i = 0; i < 5; i += 1) {
    repo.addEntryFromProduct({
      productId: product.id,
      dateLocal: '2026-11-04',
      meal: 'breakfast',
      grams: 50 + i,
    });
  }

  assert.equal(writes, 0, 'writes deferred to microtask');
  await Promise.resolve();
  assert.equal(writes, 1, 'one coalesced persist after burst');
});

test('flushPersist forces immediate write', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  let writes = 0;
  repo.setPersistHook(() => {
    writes += 1;
  });
  repo.createProduct({
    name: 'Milk',
    energyKcal: 64,
    proteinG: 3,
    fatG: 3,
    carbG: 5,
    source: 'user',
  });
  assert.equal(writes, 0);
  repo.flushPersist();
  assert.equal(writes, 1);
});
