import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('product gaps #242', () => {
  it('logPlannedMealToDiary is wired from week board UI', () => {
    const week = readFileSync(join(root, 'apps/mobile/app/plan/week.tsx'), 'utf8');
    assert.ok(week.includes('onLogMeal'));
    assert.ok(week.includes('logPlannedMealToDiary'));
    const card = readFileSync(
      join(root, 'apps/mobile/src/features/plan/PlannedMealCard.tsx'),
      'utf8',
    );
    assert.ok(card.includes('В дневник'));
    const today = readFileSync(join(root, 'apps/mobile/app/(tabs)/index.tsx'), 'utf8');
    assert.ok(today.includes('TodayPlanStrip'));
  });

  it('empty strength template cannot start a blank session', () => {
    const hub = readFileSync(join(root, 'apps/mobile/app/strength/index.tsx'), 'utf8');
    assert.ok(hub.includes('lines.length === 0'));
    assert.ok(hub.includes('Добавить упражнения') || hub.includes('strengthTemplateHref'));
    const session = readFileSync(
      join(root, 'apps/mobile/app/strength/session/[id].tsx'),
      'utf8',
    );
    assert.ok(session.includes('session-empty-exercises') || session.includes('Добавить в шаблон'));
  });

  it('domain plan→diary still round-trips with undo', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const product = repo.createProduct({
      name: 'Gap Product',
      brand: null,
      barcode: null,
      nutritionPer100g: { energyKcal: 100, proteinG: 10, fatG: 1, carbG: 5 },
    });
    const plan = repo.ensureWeekDraftPlan('2026-11-10');
    const meal = repo.addPlannedMeal({
      dateLocal: '2026-11-10',
      meal: 'lunch',
      displayName: product.name,
      grams: 150,
      productId: product.id,
      recipeId: null,
    });
    assert.equal(meal.status, 'planned');
    const entry = repo.logPlannedMealToDiary(meal.id);
    assert.ok(entry.id);
    const logged = repo.listPlannedMeals(plan.id).find((m) => m.id === meal.id);
    assert.equal(logged?.status, 'logged');
    repo.undoPlannedMealLog(meal.id, entry.id);
    const restored = repo.listPlannedMeals(plan.id).find((m) => m.id === meal.id);
    assert.equal(restored?.status, 'planned');
  });

  it('food diary empty and catalog empty expose CTAs', () => {
    const food = readFileSync(join(root, 'apps/mobile/app/(tabs)/food.tsx'), 'utf8');
    assert.ok(food.includes('diary-empty'));
    assert.ok(food.includes('EmptyState'));
    assert.ok(food.includes('onCreateManual'));
    const catalog = readFileSync(
      join(root, 'apps/mobile/src/features/diary/FoodCatalogList.tsx'),
      'utf8',
    );
    assert.ok(catalog.includes('Создать вручную') || catalog.includes('Создать продукт'));
  });
});
