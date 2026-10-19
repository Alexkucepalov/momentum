import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  estimateWorkoutKcal,
  sumActivityKcal,
  metForWorkoutType,
  macroEnergyShares,
} = mods['domain/activityEnergy'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('MET walking vs cycling', () => {
  assert.equal(metForWorkoutType('walking'), 3.5);
  assert.ok(metForWorkoutType('cycling') > metForWorkoutType('walking'));
});

test('estimateWorkoutKcal null without weight', () => {
  assert.equal(
    estimateWorkoutKcal({ type: 'walking', durationSec: 3600, weightKg: null }),
    null,
  );
});

test('estimateWorkoutKcal MET × kg × hours', () => {
  // 3.5 MET * 70 kg * 1 h = 245
  assert.equal(
    estimateWorkoutKcal({ type: 'walking', durationSec: 3600, weightKg: 70 }),
    245,
  );
});

test('sumActivityKcal rounds total', () => {
  const sum = sumActivityKcal(
    [
      { type: 'walking', durationSec: 1800 },
      { type: 'strength', durationSec: 1800 },
    ],
    70,
  );
  // 3.5*70*0.5 + 5*70*0.5 = 122.5 + 175 = 297.5 → 298
  assert.equal(sum, 298);
});

test('macroEnergyShares keeps null unknown', () => {
  const s = macroEnergyShares({ proteinG: 10, fatG: null, carbG: 20 });
  assert.equal(s.protein, 40);
  assert.equal(s.fat, null);
  assert.equal(s.knownTotal, null);
});

test('repo activity energy uses weight; food totals unchanged', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Oats',
    energyKcal: 100,
    proteinG: 10,
    fatG: 2,
    carbG: 20,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 100,
  });
  repo.addWorkout({
    dateLocal: '2026-10-17',
    type: 'cycling',
    durationSec: 3600,
    distanceM: null,
  });
  assert.equal(repo.activityEnergyKcalForDate('2026-10-17'), null);
  repo.addWeight(70, '2026-10-17T08:00:00.000Z');
  // 7.5 * 70 * 1 = 525
  assert.equal(repo.activityEnergyKcalForDate('2026-10-17'), 525);
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 100);
});
