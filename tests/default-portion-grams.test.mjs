import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  defaultProductPortionGrams,
  defaultRecipePortionGrams,
  DEFAULT_PRODUCT_PORTION_G,
} = mods['domain/defaultPortionGrams'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('UX-01: product default uses last grams else 100', () => {
  assert.equal(defaultProductPortionGrams(null), DEFAULT_PRODUCT_PORTION_G);
  assert.equal(defaultProductPortionGrams(180), 180);
  assert.equal(defaultProductPortionGrams(0), DEFAULT_PRODUCT_PORTION_G);
});

test('UX-01: recipe default uses last else min(200, yield)', () => {
  assert.equal(defaultRecipePortionGrams(null, 500), 200);
  assert.equal(defaultRecipePortionGrams(null, 150), 150);
  assert.equal(defaultRecipePortionGrams(90, 500), 90);
});

test('UX-01: lastGramsForRecipe matches newest diary serving', async () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Каша',
    cookedYieldG: 400,
    nutritionPer100g: { kcal: 100, protein: 4, fat: 2, carbs: 15 },
  });
  assert.equal(repo.lastGramsForRecipe(recipe.id), null);
  repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-20',
    meal: 'breakfast',
    grams: 120,
  });
  // Ensure createdAt ordering is stable across fast CI hosts.
  await new Promise((r) => setTimeout(r, 5));
  repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-21',
    meal: 'breakfast',
    grams: 180,
  });
  assert.equal(repo.lastGramsForRecipe(recipe.id), 180);
  assert.equal(
    defaultRecipePortionGrams(repo.lastGramsForRecipe(recipe.id), recipe.cookedYieldG),
    180,
  );
});
