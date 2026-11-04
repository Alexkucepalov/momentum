import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];
const { repeatableFromEntries } = loadSrcModules()['domain/repeatMeal'];

test('repeating a meal slot writes into that slot, not another', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Egg',
    energyKcal: 155,
    proteinG: 13,
    fatG: 11,
    carbG: 1,
    source: 'user',
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-11-04',
    meal: 'lunch',
    grams: 100,
  });

  const lunch = repo.listEntriesForDate('2026-11-04').filter((e) => e.meal === 'lunch');
  const items = repeatableFromEntries(lunch);
  assert.equal(items.length, 1);

  // Simulate UI fix: always pass section slot, never a global dinner/snack.
  const slot = 'lunch';
  for (const item of items) {
    assert.equal(item.kind, 'product');
    repo.addEntryFromProduct({
      productId: item.productId,
      dateLocal: '2026-11-04',
      meal: slot,
      grams: item.grams,
    });
  }

  const after = repo.listEntriesForDate('2026-11-04');
  assert.equal(after.filter((e) => e.meal === 'lunch').length, 2);
  assert.equal(after.filter((e) => e.meal === 'dinner').length, 0);
});
