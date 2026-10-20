import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { projectOpenShoppingSpend } = mods['domain/budgetProjection'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('projectOpenShoppingSpend sums complete open baskets', () => {
  const p = projectOpenShoppingSpend([
    {
      status: 'open',
      deletedAt: null,
      totalRub: 100,
      needLineCount: 2,
      pricedNeedCount: 2,
      label: 'ok',
    },
    {
      status: 'open',
      deletedAt: null,
      totalRub: 50,
      needLineCount: 1,
      pricedNeedCount: 1,
      label: 'ok',
    },
    {
      status: 'done',
      deletedAt: null,
      totalRub: 999,
      needLineCount: 1,
      pricedNeedCount: 1,
      label: 'ignored',
    },
  ]);
  assert.equal(p.totalRub, 150);
  assert.equal(p.incomplete, false);
  assert.ok(!/сегодня/i.test(p.label));
  assert.ok(/не live/i.test(p.label));
});

test('incomplete when any open basket total unknown', () => {
  const p = projectOpenShoppingSpend([
    {
      status: 'open',
      totalRub: 40,
      needLineCount: 1,
      pricedNeedCount: 1,
      label: 'ok',
    },
    {
      status: 'open',
      totalRub: null,
      needLineCount: 2,
      pricedNeedCount: 0,
      label: 'Сумма неизвестна',
    },
  ]);
  assert.equal(p.totalRub, null);
  assert.equal(p.knownSumRub, 40);
  assert.equal(p.incomplete, true);
});

test('repo openShoppingProjection wires lists', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const r = repo.createRecipe({
    name: 'Омлет',
    cookedYieldG: 200,
    nutritionPer100g: { kcal: 150, protein: 12, fat: 10, carbs: 2 },
    ingredients: [
      {
        displayName: 'Яйца',
        rawGrams: 200,
        nutritionPer100g: { kcal: 150, protein: 12, fat: 10, carbs: 2 },
      },
    ],
  });
  const plan = repo.createMealPlanDraft({ startDateLocal: '2026-10-20', days: 3 });
  for (const m of repo.listPlannedMeals(plan.id)) {
    repo.replacePlannedMeal(m.id, { recipeId: r.id, displayName: r.name, grams: 150 });
  }
  const list = repo.createShoppingListFromPlan(plan.id);
  const items = repo.listShoppingItems(list.id);
  assert.ok(items.length >= 1);
  for (const item of items) {
    repo.setShoppingItemPrice(item.id, {
      priceRub: 100,
      priceAsOf: '2026-10-18',
      priceSource: 'user',
    });
  }
  const proj = repo.openShoppingProjection();
  assert.equal(proj.incomplete, false);
  assert.ok(proj.totalRub != null && proj.totalRub > 0);
  assert.ok(!/сегодня/i.test(proj.label));
});
