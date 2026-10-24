import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const {
  nutritionForRecipePortion,
  nutritionPer100gCooked,
  macrosForStrip,
  nutritionKcalDelta,
  recipeHasManualPer100g,
} = mods['domain/recipeNutrition'];

test('Q-05: ingredient-derived list macros match detail and diary for same grams', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Рагу',
    cookedYieldG: 500,
    ingredients: [
      {
        displayName: 'Овощи',
        rawGrams: 400,
        nutritionPer100g: { kcal: 50, protein: 2, fat: 1, carbs: 8 },
      },
    ],
  });
  assert.equal(recipe.energyKcalPer100g, null);
  assert.equal(recipeHasManualPer100g(recipe), false);

  const ings = repo.getRecipeIngredients(recipe.id);
  const listPer100 = nutritionPer100gCooked(recipe, ings);
  const detailPer100 = nutritionForRecipePortion(recipe, ings, 100);
  assert.equal(nutritionKcalDelta(listPer100, detailPer100), 0);
  assert.equal(listPer100.kcal, 40);

  // Legacy bug: raw stored field was null while derived was 40
  assert.notEqual(recipe.energyKcalPer100g, listPer100.kcal);

  const strip = macrosForStrip(listPer100);
  assert.equal(strip.energyKcal, 40);

  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-24',
    meal: 'lunch',
    grams: 250,
  });
  const portion = nutritionForRecipePortion(recipe, ings, 250);
  assert.ok(nutritionKcalDelta({ kcal: entry.energyKcal, protein: entry.proteinG, fat: entry.fatG, carbs: entry.carbG }, portion) !== null);
  assert.ok(Math.abs((entry.energyKcal ?? 0) - (portion.kcal ?? 0)) <= 0.5);
});

test('Q-05: manual per-100g wins over ingredients for all paths', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 300,
    nutritionPer100g: { kcal: 120, protein: 5, fat: 3, carbs: 18 },
    ingredients: [
      {
        displayName: 'Хлопья',
        rawGrams: 100,
        nutritionPer100g: { kcal: 350, protein: 12, fat: 6, carbs: 60 },
      },
    ],
  });
  const ings = repo.getRecipeIngredients(recipe.id);
  const n100 = nutritionPer100gCooked(recipe, ings);
  assert.equal(n100.kcal, 120);
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-24',
    meal: 'breakfast',
    grams: 150,
  });
  assert.equal(entry.energyKcal, 180);
  const portion = nutritionForRecipePortion(recipe, ings, 150);
  assert.equal(portion.kcal, 180);
});
