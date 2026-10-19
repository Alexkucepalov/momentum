import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { repeatableFromEntries, repeatableDayFromEntries, shiftDateLocal } =
  loadSrcModules()['domain/repeatMeal'];
const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

test('repeatableFromEntries keeps product and recipe links', () => {
  const items = repeatableFromEntries([
    {
      id: '1',
      dateLocal: '2026-10-17',
      meal: 'breakfast',
      productId: 'p1',
      recipeId: null,
      displayName: 'Oats',
      grams: 50,
      energyKcal: 50,
      proteinG: 5,
      fatG: 1,
      carbG: 10,
      source: 'user',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    },
    {
      id: '2',
      dateLocal: '2026-10-17',
      meal: 'breakfast',
      productId: null,
      recipeId: 'r1',
      displayName: 'Soup',
      grams: 200,
      energyKcal: 100,
      proteinG: null,
      fatG: null,
      carbG: null,
      source: 'recipe',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    },
    {
      id: '3',
      dateLocal: '2026-10-17',
      meal: 'breakfast',
      productId: null,
      recipeId: null,
      displayName: 'orphan',
      grams: 10,
      energyKcal: null,
      proteinG: null,
      fatG: null,
      carbG: null,
      source: 'user',
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].kind, 'product');
  assert.equal(items[1].kind, 'recipe');
});

test('repeating meal copies into another slot same day', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p = repo.createProduct({ name: 'Egg', energyKcal: 140, proteinG: 12, fatG: 10, carbG: 1 });
  repo.addEntryFromProduct({
    productId: p.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 100,
  });
  const items = repeatableFromEntries(repo.listEntriesForDate('2026-10-17'));
  for (const item of items) {
    if (item.kind === 'product') {
      repo.addEntryFromProduct({
        productId: item.productId,
        dateLocal: '2026-10-17',
        meal: 'lunch',
        grams: item.grams,
      });
    }
  }
  assert.equal(repo.listEntriesForDate('2026-10-17').filter((e) => e.meal === 'lunch').length, 1);
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 280);
});

test('yesterday → today preserves meal slots', () => {
  assert.equal(shiftDateLocal('2026-10-17', -1), '2026-10-16');
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p = repo.createProduct({ name: 'Rice', energyKcal: 130, proteinG: 2, fatG: 0, carbG: 28 });
  repo.addEntryFromProduct({
    productId: p.id,
    dateLocal: '2026-10-16',
    meal: 'dinner',
    grams: 150,
  });
  const items = repeatableDayFromEntries(repo.listEntriesForDate('2026-10-16'));
  assert.equal(items[0].meal, 'dinner');
  for (const item of items) {
    repo.addEntryFromProduct({
      productId: item.productId,
      dateLocal: '2026-10-17',
      meal: item.meal,
      grams: item.grams,
    });
  }
  assert.equal(repo.listEntriesForDate('2026-10-17')[0].meal, 'dinner');
});
