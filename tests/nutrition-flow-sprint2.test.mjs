import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('kcal-only quick add keeps macros null (unknown, not zero)', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const entry = repo.addQuickEntry({
    dateLocal: '2026-10-18',
    meal: 'lunch',
    displayName: 'Кафе латте',
    energyKcal: 180,
    proteinG: null,
    fatG: null,
    carbG: null,
  });
  assert.equal(entry.energyKcal, 180);
  assert.equal(entry.proteinG, null);
  assert.equal(entry.fatG, null);
  assert.equal(entry.carbG, null);
  const totals = repo.dailyTotals('2026-10-18');
  assert.equal(totals.energyKcal, 180);
  assert.equal(totals.proteinG, null);
  assert.equal(totals.hasUnknownFields, true);
});

test('macro quick add does not invent missing kcal as zero', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const entry = repo.addQuickEntry({
    dateLocal: '2026-10-18',
    meal: 'snack',
    displayName: 'Яблоко',
    energyKcal: null,
    proteinG: 0.3,
    fatG: 0.2,
    carbG: 14,
  });
  assert.equal(entry.energyKcal, null);
  assert.equal(entry.proteinG, 0.3);
  const totals = repo.dailyTotals('2026-10-18');
  assert.equal(totals.energyKcal, null);
  assert.equal(totals.hasUnknownFields, true);
});

test('recent product repeat uses last grams in one shot', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Овсянка',
    energyKcal: 350,
    proteinG: 12,
    fatG: 6,
    carbG: 60,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 200,
  });
  assert.equal(repo.lastGramsForProduct(product.id), 200);

  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-18',
    meal: 'breakfast',
    grams: repo.lastGramsForProduct(product.id) ?? 100,
  });
  const today = repo.listEntriesForDate('2026-10-18');
  assert.equal(today.length, 1);
  assert.equal(today[0].grams, 200);
  assert.equal(today[0].energyKcal, 700);
});

test('entry snapshot survives later product nutrition edit', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Творог',
    energyKcal: 100,
    proteinG: 16,
    fatG: 5,
    carbG: 3,
  });
  const entry = repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-18',
    meal: 'breakfast',
    grams: 100,
  });
  repo.updateProductNutrition(product.id, {
    energyKcal: 999,
    proteinG: 1,
    fatG: 1,
    carbG: 1,
  });
  const again = repo.listEntriesForDate('2026-10-18').find((e) => e.id === entry.id);
  assert.ok(again);
  assert.equal(again.energyKcal, 100);
  assert.equal(again.proteinG, 16);
});
