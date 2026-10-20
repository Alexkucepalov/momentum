import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const {
  nutritionForRecipePortion,
  recipeHasManualPer100g,
} = mods['domain/recipeNutrition'];

test('manual per-100g recipe logs without ingredients', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 300,
    description: 'Утренний вариант',
    instructions: 'Залить кипятком',
    photoUri: 'file:///recipes/oats.jpg',
    nutritionPer100g: { kcal: 120, protein: 5, fat: 3, carbs: 18 },
    ingredients: [],
  });
  assert.equal(recipe.description, 'Утренний вариант');
  assert.equal(recipe.photoUri, 'file:///recipes/oats.jpg');
  assert.equal(recipe.energyKcalPer100g, 120);
  assert.ok(recipeHasManualPer100g(recipe));
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 150,
  });
  assert.equal(entry.energyKcal, 180);
  assert.equal(entry.proteinG, 7.5);
});

test('ingredient-derived recipe still works when no manual KBJU', () => {
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
  const n = nutritionForRecipePortion(recipe, repo.getRecipeIngredients(recipe.id), 100);
  // raw 200 kcal / 500g cooked → 40 kcal per 100g cooked
  assert.equal(n.kcal, 40);
});

test('updateRecipe changes description and soft delete hides from list', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Суп',
    cookedYieldG: 800,
    nutritionPer100g: { kcal: 40, protein: 2, fat: 1, carbs: 5 },
  });
  repo.updateRecipe(recipe.id, {
    description: 'Куриный',
    nutritionPer100g: { kcal: 45, protein: 3, fat: 1, carbs: 5 },
  });
  assert.equal(repo.getRecipe(recipe.id)?.description, 'Куриный');
  assert.equal(repo.getRecipe(recipe.id)?.energyKcalPer100g, 45);
  repo.softDeleteRecipe(recipe.id);
  assert.equal(repo.listRecipes().length, 0);
  assert.equal(repo.getRecipe(recipe.id), null);
});

test('v6 recipe migrates optional detail fields', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 6,
      profile: {
        id: 'p',
        timezone: 'UTC',
        locale: 'en',
        units: 'metric',
        waterTargetMl: 2000,
        dogfoodStartedOn: null,
        heightCm: null,
        dailyEnergyKcal: null,
        dailyProteinG: null,
        dailyFatG: null,
        dailyCarbG: null,
      },
      products: [],
      recipes: [
        {
          id: 'r1',
          name: 'Old',
          cookedYieldG: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      ingredients: [
        {
          id: 'i1',
          recipeId: 'r1',
          productId: null,
          displayName: 'X',
          rawGrams: 100,
          energyKcal: 100,
          proteinG: 1,
          fatG: 1,
          carbG: 1,
        },
      ],
      entries: [],
    },
  });
  const r = repo.getRecipe('r1');
  assert.equal(r?.description, null);
  assert.equal(r?.photoUri, null);
  assert.equal(r?.energyKcalPer100g, null);
  assert.equal(repo.toSnapshot().version, 12);
});
