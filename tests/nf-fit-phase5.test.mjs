import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 5 schema: SCHEMA_VERSION 7 activates planner entities', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE5_ACTIVE_ENTITIES,
  } = mods['storage/migrations'];

  assert.equal(SCHEMA_VERSION, 7);
  assert.ok(PHASE5_ACTIVE_ENTITIES.includes('MealPlan'));
  assert.ok(PHASE5_ACTIVE_ENTITIES.includes('PlannedMeal'));
  assert.ok(PHASE5_ACTIVE_ENTITIES.includes('PantryItem'));
  assert.ok(PHASE5_ACTIVE_ENTITIES.includes('BudgetEntry'));

  const migrations = new Map();
  const meta = new Map();
  const stubs = new Map();

  const db = {
    execSync() {},
    getFirstSync(sql) {
      if (String(sql).includes('MAX(version)')) {
        const versions = [...migrations.keys()];
        return { version: versions.length ? Math.max(...versions) : null };
      }
      return null;
    },
    runSync(sql, params = []) {
      const s = String(sql);
      if (s.includes('schema_migrations')) {
        migrations.set(params[0], params[1]);
        return;
      }
      if (s.includes('app_meta')) {
        meta.set(params[0], params[1]);
        return;
      }
      if (s.includes('schema_entity_stub')) {
        if (s.includes("'active'") || s.includes('DO UPDATE')) {
          stubs.set(params[0], { status: 'active', notes: params[1] });
        } else if (!stubs.has(params[0])) {
          stubs.set(params[0], { status: params[1], notes: params[2] });
        }
      }
    },
  };

  migrateExpoDb(db);
  assert.equal(getAppliedSchemaVersion(db), 7);
  assert.equal(meta.get('phase'), '5-planner');
  for (const name of PHASE5_ACTIVE_ENTITIES) {
    assert.ok(stubs.has(name), `missing ${name}`);
    assert.equal(stubs.get(name).status, 'active');
  }
});

test('Phase 5: plan draft ≠ diary; explicit log; pantry/shop exist', () => {
  const { createMemoryFoodRepository } = mods['storage/foodRepository'];

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

  const dateLocal = '2026-10-20';
  const before = repo.dailyTotals(dateLocal).entryCount;
  const plan = repo.createMealPlanDraft({
    startDateLocal: dateLocal,
    days: 3,
    budgetRub: 3500,
    cookSessions: 2,
  });
  assert.equal(plan.status, 'draft');
  assert.equal(repo.dailyTotals(dateLocal).entryCount, before, 'plan must not write diary');

  const planned = repo.listPlannedMeals(plan.id);
  assert.ok(planned.length > 0);
  const first = planned[0];
  assert.equal(first.status, 'planned');

  const entry = repo.logPlannedMealToDiary(first.id);
  assert.ok(entry.id);
  assert.equal(repo.dailyTotals(dateLocal).entryCount, before + 1);
  const afterLog = repo.listPlannedMeals(plan.id).find((m) => m.id === first.id);
  assert.equal(afterLog?.status, 'logged');

  // Pantry / shopping APIs available (smoke)
  assert.equal(typeof repo.listPantryItems, 'function');
  assert.equal(typeof repo.listShoppingLists, 'function');
});

test('Phase 5 Plan hub uses design system; plan ≠ diary copy', () => {
  const path = 'apps/mobile/app/plan/index.tsx';
  assert.ok(existsSync(join(root, path)));
  const src = readFileSync(join(root, path), 'utf8');
  assert.ok(src.includes('@/src/design-system'));
  assert.ok(src.includes('AppCard'));
  assert.ok(src.includes('Plan ≠ diary') || src.includes('не дневник'));
  assert.ok(src.includes('eat-now'));
  assert.ok(src.includes('week'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(src));
});
