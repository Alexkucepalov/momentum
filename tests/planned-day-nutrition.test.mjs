import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const {
  sumPlannedMacros,
  remainingToTarget,
  nutritionForPlannedMeal,
  buildPlannedDayNutrition,
} = loadSrcModules()['domain/plannedDayNutrition'];

test('sumPlannedMacros sums known only; all unknown stays null', () => {
  assert.deepEqual(
    sumPlannedMacros([
      { energyKcal: null, proteinG: null, fatG: null, carbG: null },
      { energyKcal: null, proteinG: null, fatG: null, carbG: null },
    ]),
    { energyKcal: null, proteinG: null, fatG: null, carbG: null },
  );
  assert.deepEqual(
    sumPlannedMacros([
      { energyKcal: 100, proteinG: null, fatG: 5, carbG: null },
      { energyKcal: 50, proteinG: 10, fatG: null, carbG: null },
    ]),
    { energyKcal: 150, proteinG: 10, fatG: 5, carbG: null },
  );
});

test('remainingToTarget null when either side unknown', () => {
  assert.deepEqual(
    remainingToTarget(
      { energyKcal: 500, proteinG: null, fatG: 20, carbG: 40 },
      { energyKcal: 2000, proteinG: 120, fatG: null, carbG: 200 },
    ),
    { energyKcal: 1500, proteinG: null, fatG: null, carbG: 160 },
  );
});

test('nutritionForPlannedMeal from product; missing recipe → all null', () => {
  const product = {
    id: 'p1',
    name: 'Творог',
    energyKcal: 90,
    proteinG: 16,
    fatG: 2,
    carbG: 3,
  };
  const lookup = {
    getRecipe: () => null,
    getRecipeIngredients: () => [],
    getProduct: (id) => (id === 'p1' ? product : null),
  };
  const macros = nutritionForPlannedMeal(
    { recipeId: null, productId: 'p1', grams: 100 },
    lookup,
  );
  assert.equal(macros.energyKcal, 90);
  assert.equal(macros.proteinG, 16);

  const missing = nutritionForPlannedMeal(
    { recipeId: 'nope', productId: null, grams: 100 },
    lookup,
  );
  assert.deepEqual(missing, {
    energyKcal: null,
    proteinG: null,
    fatG: null,
    carbG: null,
  });
});

test('buildPlannedDayNutrition aggregates and never invents zero', () => {
  const recipe = {
    id: 'r1',
    name: 'Овсянка',
    cookedYieldG: 400,
    energyKcalPer100g: 90,
    proteinGPer100g: 4,
    fatGPer100g: 2,
    carbGPer100g: 14,
  };
  const lookup = {
    getRecipe: (id) => (id === 'r1' ? recipe : null),
    getRecipeIngredients: () => [],
    getProduct: () => null,
  };
  const day = buildPlannedDayNutrition({
    meals: [
      {
        id: 'm1',
        planId: 'pl',
        dateLocal: '2026-11-03',
        meal: 'breakfast',
        recipeId: 'r1',
        productId: null,
        displayName: 'Овсянка',
        grams: 200,
        status: 'planned',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
      {
        id: 'm2',
        planId: 'pl',
        dateLocal: '2026-11-03',
        meal: 'lunch',
        recipeId: null,
        productId: null,
        displayName: 'Без макросов',
        grams: 100,
        status: 'planned',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    targets: {
      energyKcal: 2000,
      proteinG: null,
      fatG: null,
      carbG: null,
    },
    lookup,
  });
  assert.equal(day.mealCount, 2);
  assert.equal(day.energyKcal, 180);
  assert.equal(day.remaining.energyKcal, 1820);
  assert.equal(day.remaining.proteinG, null);
});
