import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { buildCookAgainInput } = mods['domain/cookAgain'];
const { nutritionForRecipePortion } = mods['domain/recipeNutrition'];

test('buildCookAgainInput clones with new yield and preserves snapshots', () => {
  const recipe = {
    id: 'r1',
    name: 'Борщ',
    cookedYieldG: 2000,
    description: null,
    instructions: null,
    photoUri: null,
    energyKcalPer100g: null,
    proteinGPer100g: null,
    fatGPer100g: null,
    carbGPer100g: null,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  };
  const ingredients = [
    {
      id: 'i1',
      recipeId: 'r1',
      productId: null,
      displayName: 'Свёкла',
      rawGrams: 500,
      energyKcal: 40,
      proteinG: 1.5,
      fatG: 0.1,
      carbG: 9,
    },
  ];
  const input = buildCookAgainInput(
    recipe,
    ingredients,
    { cookedYieldG: 1800, ingredientRawGrams: { i1: 480 } },
    '2026-10-18',
  );
  assert.match(input.name, /партия/);
  assert.equal(input.cookedYieldG, 1800);
  assert.equal(input.nutritionPer100g, null);
  assert.equal(input.ingredients[0].rawGrams, 480);
  assert.equal(input.ingredients[0].nutritionPer100g.kcal, 40);
});

test('cookAgainRecipe creates batch; source recipe unchanged', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const source = repo.createRecipe({
    name: 'Каша',
    cookedYieldG: 500,
    ingredients: [
      {
        displayName: 'Овёс',
        rawGrams: 100,
        nutritionPer100g: { kcal: 350, protein: 12, fat: 6, carbs: 60 },
      },
      {
        displayName: 'Молоко',
        rawGrams: 300,
        nutritionPer100g: { kcal: 50, protein: 3, fat: 2, carbs: 5 },
      },
    ],
  });
  const batch = repo.cookAgainRecipe(
    source.id,
    { cookedYieldG: 420 },
    '2026-10-18',
  );
  assert.notEqual(batch.id, source.id);
  assert.match(batch.name, /партия/);
  assert.equal(batch.cookedYieldG, 420);
  assert.equal(repo.getRecipe(source.id)?.cookedYieldG, 500);

  const ings = repo.getRecipeIngredients(batch.id);
  const per100 = nutritionForRecipePortion(batch, ings, 100);
  assert.ok(per100.kcal != null && per100.kcal > 0);
});

test('importAll restores export and rejects garbage', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p = repo.createProduct({
    name: 'Рис',
    energyKcal: 130,
    proteinG: 2,
    fatG: 0,
    carbG: 28,
  });
  repo.addEntryFromProduct({
    productId: p.id,
    dateLocal: '2026-10-18',
    meal: 'lunch',
    grams: 150,
  });
  const json = repo.exportAll();

  repo.deleteAllUserData();
  assert.ok(repo.listProducts().length > 0);
  assert.ok(repo.listProducts().every((p) => p.id.startsWith('seed:')));

  const summary = repo.importAll(json);
  assert.ok(summary.products >= 1);
  assert.ok(repo.listProducts().some((x) => x.id === p.id && x.name === 'Рис'));
  assert.equal(summary.entries, 1);
  assert.equal(repo.listEntriesForDate('2026-10-18').length, 1);
  assert.equal(repo.listEntriesForDate('2026-10-18')[0].energyKcal, 195);

  assert.throws(() => repo.importAll('{bad'), /JSON|Неверный/);
  assert.throws(() => repo.importAll('{"version":99,"profile":{},"products":[],"recipes":[],"entries":[]}'), /верси/);
});
