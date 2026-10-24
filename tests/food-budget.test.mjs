import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  buildMonthBudgetSnapshot,
  estimateEatenCostRub,
  forecastMonthSpend,
  monthKeyFromDateLocal,
  sumEatenCost,
  sumKnownExpenses,
} = mods['domain/foodBudget'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('monthKeyFromDateLocal', () => {
  assert.equal(monthKeyFromDateLocal('2026-10-20'), '2026-10');
});

test('sumKnownExpenses unknown ≠ 0', () => {
  assert.deepEqual(sumKnownExpenses([100, null]), { total: null, incomplete: true });
  assert.deepEqual(sumKnownExpenses([100, 50]), { total: 150, incomplete: false });
});

test('forecast needs enough elapsed days', () => {
  assert.equal(forecastMonthSpend({ spentRub: 3000, daysElapsed: 0, daysInMonth: 30 }), null);
  assert.equal(forecastMonthSpend({ spentRub: 3000, daysElapsed: 3, daysInMonth: 30 }), null);
  assert.equal(forecastMonthSpend({ spentRub: 3000, daysElapsed: 10, daysInMonth: 30 }), 9000);
  assert.equal(forecastMonthSpend({ spentRub: null, daysElapsed: 10, daysInMonth: 30 }), null);
});

test('budget snapshot + repo expenses', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  assert.equal(repo.toSnapshot().version, 14);
  repo.setFoodBudget('2026-10', 30000);
  repo.addFoodExpense({
    amountRub: 1200,
    category: 'groceries',
    spentOn: '2026-10-05',
  });
  repo.addFoodExpense({
    amountRub: 450,
    category: 'cafe',
    spentOn: '2026-10-12',
  });
  const snap = repo.monthBudgetSnapshot('2026-10', '2026-10-20');
  assert.equal(snap.limitRub, 30000);
  assert.equal(snap.spentRub, 1650);
  assert.equal(snap.remainingRub, 28350);
  assert.ok(snap.forecastRub !== null && snap.forecastRub > 1650);

  const domain = buildMonthBudgetSnapshot({
    month: '2026-10',
    limitRub: 30000,
    expenseAmounts: [1200, 450],
    asOfDateLocal: '2026-10-20',
  });
  assert.equal(domain.spentRub, 1650);
});

test('store preferences toggle', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const list = repo.listStorePreferences();
  assert.ok(list.length >= 5);
  const py = list.find((s) => s.storeId === 'pyaterochka');
  assert.ok(py);
  const next = repo.setStorePreferenceSelected('pyaterochka', true);
  assert.equal(next.selected, true);
});

test('estimateEatenCost + sumEatenCost unknown ≠ 0', () => {
  assert.equal(
    estimateEatenCostRub({ grams: 250, priceRub: 400, pricePerUnitG: 1000 }),
    100,
  );
  assert.equal(estimateEatenCostRub({ grams: 250, priceRub: null, pricePerUnitG: 1000 }), null);
  const partial = sumEatenCost([100, null, 50]);
  assert.equal(partial.total, null);
  assert.equal(partial.knownSum, 150);
  assert.equal(partial.knownCount, 2);
  assert.equal(partial.incomplete, true);
});

test('monthEatenCostEstimate from diary + ₽/kg prices', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p = repo.createProduct({
    name: 'Курица',
    energyKcal: 110,
    proteinG: 23,
    fatG: 2,
    carbG: 0,
  });
  repo.addEntryFromProduct({
    productId: p.id,
    dateLocal: '2026-10-10',
    meal: 'lunch',
    grams: 200,
  });
  repo.upsertProductPrice({
    productKey: 'курица|g',
    priceRub: 500,
    unit: 'g',
    observedOn: '2026-10-01',
    source: 'user',
  });
  const cost = repo.monthEatenCostEstimate('2026-10');
  assert.equal(cost.totalRub, 100);
  assert.equal(cost.incomplete, false);
});

test('listPlannedMealsForDate ignores archived plans', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 400,
    nutritionPer100g: { kcal: 90, protein: 4, fat: 2, carbs: 14 },
  });
  const a = repo.createMealPlanDraft({ startDateLocal: '2026-10-20', days: 3 });
  const b = repo.createMealPlanDraft({ startDateLocal: '2026-10-20', days: 3 });
  assert.equal(repo.getMealPlan(a.id)?.status, 'archived');
  assert.equal(repo.getMealPlan(b.id)?.status, 'draft');
  const today = repo.listPlannedMealsForDate('2026-10-20');
  assert.ok(today.every((m) => m.planId === b.id));
});
