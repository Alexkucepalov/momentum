import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { buildMealPlanDraft, endDateForPeriod } = mods['domain/mealPlanDraft'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('endDateForPeriod for 7 days', () => {
  assert.equal(endDateForPeriod('2026-10-20', 7), '2026-10-26');
});

test('buildMealPlanDraft empty recipes → empty lines', () => {
  const d = buildMealPlanDraft({
    startDateLocal: '2026-10-20',
    days: 3,
    recipes: [],
  });
  assert.equal(d.lines.length, 0);
  assert.equal(d.endDateLocal, '2026-10-22');
});

test('buildMealPlanDraft fills 3 meals × days', () => {
  const d = buildMealPlanDraft({
    startDateLocal: '2026-10-20',
    days: 3,
    cookSessions: 2,
    recipes: [
      { id: 'r1', name: 'Курица', defaultGrams: 150 },
      { id: 'r2', name: 'Творог', defaultGrams: 200 },
    ],
  });
  assert.equal(d.lines.length, 9);
  assert.ok(d.lines.every((l) => l.grams > 0 && l.recipeId));
});

test('create draft does not touch diary totals', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 400,
    nutritionPer100g: { kcal: 90, protein: 4, fat: 2, carbs: 14 },
  });
  repo.createRecipe({
    name: 'Курица',
    cookedYieldG: 600,
    nutritionPer100g: { kcal: 120, protein: 25, fat: 2, carbs: 0 },
  });

  const before = repo.dailyTotals('2026-10-20').entryCount;
  const plan = repo.createMealPlanDraft({
    startDateLocal: '2026-10-20',
    days: 3,
    budgetRub: 3500,
    cookSessions: 2,
    diversity: 'balanced',
  });
  assert.equal(plan.status, 'draft');
  assert.equal(repo.dailyTotals('2026-10-20').entryCount, before);
  assert.ok(repo.listPlannedMeals(plan.id).length > 0);
  assert.equal(repo.toSnapshot().version, 18);

  const second = repo.createMealPlanDraft({
    startDateLocal: '2026-10-20',
    days: 5,
  });
  assert.equal(second.status, 'draft');
  assert.equal(repo.getMealPlan(plan.id)?.status, 'archived');
});

test('logPlannedMealToDiary is explicit; move and portion work', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.createRecipe({
    name: 'Рис',
    cookedYieldG: 500,
    nutritionPer100g: { kcal: 130, protein: 3, fat: 0.5, carbs: 28 },
  });
  const plan = repo.createMealPlanDraft({
    startDateLocal: '2026-10-20',
    days: 3,
  });
  const meal = repo.listPlannedMeals(plan.id)[0];
  repo.updatePlannedMealGrams(meal.id, 180);
  repo.movePlannedMeal(meal.id, { dateLocal: '2026-10-21', meal: 'dinner' });
  const moved = repo.listPlannedMeals(plan.id).find((m) => m.id === meal.id);
  assert.equal(moved.dateLocal, '2026-10-21');
  assert.equal(moved.meal, 'dinner');
  assert.equal(moved.grams, 180);

  assert.equal(repo.dailyTotals('2026-10-21').entryCount, 0);
  repo.logPlannedMealToDiary(meal.id);
  assert.equal(repo.dailyTotals('2026-10-21').entryCount, 1);
  assert.equal(repo.listPlannedMeals(plan.id).find((m) => m.id === meal.id).status, 'logged');
});

test('addPlannedMeal creates empty draft and never logs diary', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Творог',
    energyKcal: 90,
    proteinG: 16,
    fatG: 2,
    carbG: 3,
  });
  const before = repo.dailyTotals('2026-10-22').entryCount;
  const planned = repo.addPlannedMeal({
    dateLocal: '2026-10-22',
    meal: 'snack',
    displayName: 'Творог',
    grams: 150,
    productId: product.id,
  });
  assert.equal(planned.status, 'planned');
  assert.equal(planned.productId, product.id);
  assert.equal(repo.dailyTotals('2026-10-22').entryCount, before);
  const today = repo.listPlannedMealsForDate('2026-10-22');
  assert.equal(today.length, 1);
  assert.equal(today[0].displayName, 'Творог');
});
