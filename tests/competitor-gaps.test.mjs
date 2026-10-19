import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { buildWeekNutrition, averageKnownKcal } = mods['domain/weekNutrition'];

test('quick add logs absolute macros without product', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const entry = repo.addQuickEntry({
    dateLocal: '2026-10-17',
    meal: 'snack',
    displayName: 'Кофе',
    energyKcal: 80,
    proteinG: 2,
    fatG: 3,
    carbG: null,
  });
  assert.equal(entry.productId, null);
  assert.equal(entry.recipeId, null);
  assert.equal(entry.energyKcal, 80);
  assert.equal(entry.carbG, null);
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 80);
  assert.equal(repo.dailyTotals('2026-10-17').hasUnknownFields, true);
});

test('saved meal create and log in one shot', () => {
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
    energyKcal: 50,
    proteinG: 3,
    fatG: 2,
    carbG: 5,
  });
  repo.addEntryFromProduct({
    productId: oats.id,
    dateLocal: '2026-10-16',
    meal: 'breakfast',
    grams: 50,
  });
  repo.addEntryFromProduct({
    productId: milk.id,
    dateLocal: '2026-10-16',
    meal: 'breakfast',
    grams: 100,
  });
  const saved = repo.createSavedMealFromEntries(
    'Завтрак будни',
    repo.listEntriesForDate('2026-10-16'),
    'breakfast',
  );
  assert.equal(saved.items.length, 2);
  const logged = repo.logSavedMeal({
    savedMealId: saved.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
  });
  assert.equal(logged.length, 2);
  assert.equal(repo.dailyTotals('2026-10-17').entryCount, 2);
  // 50% of oats 100kcal + 100% of milk 50 = 50+50 = 100
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 100);
});

test('week nutrition strip math', () => {
  const map = {
    '2026-10-11': { energyKcal: 2000, entryCount: 3 },
    '2026-10-12': { energyKcal: null, entryCount: 1 },
    '2026-10-13': { energyKcal: 1800, entryCount: 2 },
    '2026-10-14': { energyKcal: 2200, entryCount: 4 },
    '2026-10-15': { energyKcal: 0, entryCount: 0 },
    '2026-10-16': { energyKcal: 2100, entryCount: 3 },
    '2026-10-17': { energyKcal: 1900, entryCount: 2 },
  };
  // 2026-10-17 Sat → calendar week Mon 12 … Sun 18
  const days = buildWeekNutrition({
    endDateLocal: '2026-10-17',
    targetKcal: 2000,
    totalsForDate: (d) => map[d] ?? { energyKcal: null, entryCount: 0 },
  });
  assert.equal(days.length, 7);
  assert.equal(days[0].dateLocal, '2026-10-12');
  assert.equal(days[5].dateLocal, '2026-10-17');
  assert.equal(days[6].dateLocal, '2026-10-18');
  assert.equal(days[0].weekdayIndex, 0);
  assert.ok(days[4].vsTarget != null && Math.abs(days[4].vsTarget - 1.05) < 0.001); // Fri 16
  assert.equal(days[0].vsTarget, null); // Mon 12 unknown kcal
  const avg = averageKnownKcal(days);
  assert.ok(avg != null && avg > 0);
});

test('snapshot v8 includes saved meals', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p = repo.createProduct({ name: 'X', energyKcal: 10, proteinG: 1, fatG: 0, carbG: 1 });
  repo.createSavedMeal({
    name: 'Mini',
    items: [{ productId: p.id, recipeId: null, displayName: 'X', grams: 100 }],
  });
  assert.equal(repo.toSnapshot().version, 9);
  assert.equal(repo.toSnapshot().savedMeals.length, 1);
});
