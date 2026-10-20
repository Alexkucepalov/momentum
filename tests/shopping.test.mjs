import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  aggregateShopping,
  estimateBasketTotal,
  scaleIngredientGrams,
  shoppingKey,
} = mods['domain/aggregateShopping'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('scaleIngredientGrams proportional', () => {
  assert.equal(scaleIngredientGrams(500, 1000, 200), 100);
  assert.throws(() => scaleIngredientGrams(10, 0, 100));
});

test('aggregateShopping merges same name+unit', () => {
  const lines = aggregateShopping([
    { displayName: 'Куриная грудка', quantity: 500, unit: 'g' },
    { displayName: 'куриная  грудка', quantity: 1000, unit: 'g' },
    { displayName: 'Яйца', quantity: 6, unit: 'pcs' },
  ]);
  const chicken = lines.find((l) => l.unit === 'g');
  assert.equal(chicken.quantity, 1500);
  assert.equal(chicken.needToBuy, 1500);
});

test('pantry coverage reduces needToBuy; unknown pantry qty = 0 cover', () => {
  const lines = aggregateShopping(
    [{ displayName: 'Рис', quantity: 500, unit: 'g' }],
    [{ displayName: 'Рис', quantityG: 200, quantityCount: null, unit: 'g' }],
  );
  assert.equal(lines[0].coveredByPantry, 200);
  assert.equal(lines[0].needToBuy, 300);

  const unknown = aggregateShopping(
    [{ displayName: 'Рис', quantity: 500, unit: 'g' }],
    [{ displayName: 'Рис', quantityG: null, quantityCount: null, unit: 'g' }],
  );
  assert.equal(unknown[0].coveredByPantry, 0);
  assert.equal(unknown[0].needToBuy, 500);
});

test('estimateBasketTotal never fakes full sum', () => {
  const partial = estimateBasketTotal([
    {
      key: 'a',
      displayName: 'A',
      quantity: 1,
      unit: 'g',
      coveredByPantry: 0,
      needToBuy: 1,
      priceRub: 100,
      priceAsOf: '2026-10-01',
      priceSource: 'user',
    },
    {
      key: 'b',
      displayName: 'B',
      quantity: 1,
      unit: 'g',
      coveredByPantry: 0,
      needToBuy: 1,
      priceRub: null,
      priceAsOf: null,
      priceSource: null,
    },
  ]);
  assert.equal(partial.totalRub, null);
  assert.match(partial.label, /неизвестна/i);

  const full = estimateBasketTotal([
    {
      key: 'a',
      displayName: 'A',
      quantity: 1,
      unit: 'g',
      coveredByPantry: 0,
      needToBuy: 1,
      priceRub: 90,
      priceAsOf: '2026-10-01',
      priceSource: 'user',
    },
  ]);
  assert.equal(full.totalRub, 90);
  assert.match(full.label, /прошлым|вашим/i);
});

test('createShoppingListFromPlan merges ingredients; plan≠diary', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const r = repo.createRecipe({
    name: 'Курица с рисом',
    cookedYieldG: 1000,
    ingredients: [
      {
        displayName: 'Курица',
        rawGrams: 600,
        nutritionPer100g: { kcal: 120, protein: 25, fat: 2, carbs: 0 },
      },
      {
        displayName: 'Рис',
        rawGrams: 400,
        nutritionPer100g: { kcal: 130, protein: 3, fat: 0.5, carbs: 28 },
      },
    ],
  });
  repo.upsertPantryItem({
    displayName: 'Рис',
    location: 'pantry',
    unit: 'g',
    quantityG: 100,
  });
  const plan = repo.createMealPlanDraft({ startDateLocal: '2026-10-20', days: 3 });
  // Force both meals to use our recipe for predictable merge
  for (const m of repo.listPlannedMeals(plan.id)) {
    repo.replacePlannedMeal(m.id, {
      recipeId: r.id,
      displayName: r.name,
      grams: 200,
    });
  }
  const before = repo.dailyTotals('2026-10-20').entryCount;
  const list = repo.createShoppingListFromPlan(plan.id);
  assert.equal(repo.dailyTotals('2026-10-20').entryCount, before);
  const items = repo.listShoppingItems(list.id);
  assert.ok(items.length >= 2);
  const rice = items.find((i) => i.displayName === 'Рис');
  assert.ok(rice);
  assert.ok(rice.coveredByPantry >= 100);
  assert.equal(repo.toSnapshot().version, 14);
  assert.equal(shoppingKey('Рис', 'g'), 'рис|g');
});

test('user price label path via basket total', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.createRecipe({
    name: 'Творог блюдо',
    cookedYieldG: 400,
    nutritionPer100g: { kcal: 120, protein: 16, fat: 5, carbs: 3 },
    ingredients: [
      {
        displayName: 'Творог',
        rawGrams: 400,
        nutritionPer100g: { kcal: 120, protein: 16, fat: 5, carbs: 3 },
      },
    ],
  });
  const plan = repo.createMealPlanDraft({ startDateLocal: '2026-10-20', days: 3 });
  const list = repo.createShoppingListFromPlan(plan.id);
  const item = repo.listShoppingItems(list.id).find((i) => i.needToBuy > 0);
  assert.ok(item);
  repo.setShoppingItemPrice(item.id, {
    priceRub: 180,
    priceAsOf: '2026-10-18',
    priceSource: 'user',
  });
  const total = repo.shoppingBasketTotal(list.id);
  // may still be partial if other lines lack prices
  assert.ok(total.label.includes('неизвестна') || total.totalRub !== null);
  assert.ok(!/сегодня/i.test(total.label));
});
