import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { decreaseCookedRemaining, pickFifoBatchId } = mods['domain/cookedBatch'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('decreaseCookedRemaining clamps to zero', () => {
  assert.equal(decreaseCookedRemaining(200, 50), 150);
  assert.equal(decreaseCookedRemaining(40, 100), 0);
  assert.throws(() => decreaseCookedRemaining(10, -1));
  assert.throws(() => decreaseCookedRemaining(NaN, 1));
});

test('pickFifoBatchId skips empty and deleted', () => {
  const id = pickFifoBatchId([
    { id: 'a', cookedAt: '2026-10-18T10:00:00.000Z', remainingG: 0, deletedAt: null },
    { id: 'b', cookedAt: '2026-10-17T10:00:00.000Z', remainingG: 100, deletedAt: null },
    { id: 'c', cookedAt: '2026-10-16T10:00:00.000Z', remainingG: 50, deletedAt: 'x' },
  ]);
  assert.equal(id, 'b');
});

test('snapshot migrates to v10 with empty pantry', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 9,
      profile: {
        id: 'p',
        timezone: 'UTC',
        locale: 'ru',
        units: 'metric',
      },
      products: [],
      recipes: [],
      ingredients: [],
      entries: [],
    },
  });
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 10);
  assert.deepEqual(snap.pantryItems, []);
  assert.deepEqual(snap.cookedBatches, []);
});

test('pantry CRUD soft-delete', () => {
  const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
  const item = repo.upsertPantryItem({
    displayName: 'Творог',
    location: 'fridge',
    unit: 'g',
    quantityG: 400,
  });
  assert.equal(repo.listPantryItems().length, 1);
  repo.softDeletePantryItem(item.id);
  assert.equal(repo.listPantryItems().length, 0);
});

test('diary log of recipe decreases FIFO cooked batch', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Курица',
    cookedYieldG: 500,
    nutritionPer100g: { kcal: 120, protein: 25, fat: 2, carbs: 0 },
  });
  const batch = repo.createCookedBatch({ recipeId: recipe.id, initialYieldG: 500 });
  assert.equal(batch.remainingG, 500);

  repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-20',
    meal: 'dinner',
    grams: 150,
  });

  const after = repo.listCookedBatches({ recipeId: recipe.id })[0];
  assert.equal(after.remainingG, 350);

  repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-20',
    meal: 'dinner',
    grams: 400,
  });
  assert.equal(repo.listCookedBatches({ recipeId: recipe.id })[0].remainingG, 0);
});

test('logging recipe without batch does not invent batch', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Рис',
    cookedYieldG: 300,
    nutritionPer100g: { kcal: 130, protein: 3, fat: 0.5, carbs: 28 },
  });
  repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-20',
    meal: 'lunch',
    grams: 100,
  });
  assert.equal(repo.listCookedBatches().length, 0);
});
