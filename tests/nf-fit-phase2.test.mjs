import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 2 schema: SCHEMA_VERSION 4 activates recipe entities', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE2_ACTIVE_ENTITIES,
  } = mods['storage/migrations'];

  assert.ok(SCHEMA_VERSION >= 4);
  assert.deepEqual([...PHASE2_ACTIVE_ENTITIES], [
    'Recipe',
    'RecipeIngredient',
    'RecipeSnapshot',
  ]);

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
  assert.equal(getAppliedSchemaVersion(db), SCHEMA_VERSION);
  assert.equal(meta.get('product'), 'nf-fit');
  for (const name of PHASE2_ACTIVE_ENTITIES) {
    assert.ok(stubs.has(name), `missing stub ${name}`);
    assert.equal(stubs.get(name).status, 'active');
  }
});

test('Phase 2 recipes: CRUD, cooked yield portions, unknown ≠ 0, import text, snapshot', () => {
  const { createMemoryFoodRepository } = mods['storage/foodRepository'];
  const { nutritionForRecipePortion } = mods['domain/recipeNutrition'];
  const { recipePortion } = mods['domain/nutrition'];
  const { parseRecipeText } = mods['domain/parseRecipeText'];
  const { formatMetricValue } = mods['design-system/metricFormat'];

  const repo = createMemoryFoodRepository({ timezone: 'UTC' });

  const oats = repo.createProduct({
    name: 'Овсянка',
    energyKcal: 370,
    proteinG: 13,
    fatG: 7,
    carbG: 60,
    source: 'catalog',
  });
  const mystery = repo.createProduct({
    name: 'Без этикетки',
    energyKcal: null,
    proteinG: null,
    fatG: null,
    carbG: null,
    source: 'missing',
  });

  const recipe = repo.createRecipe({
    name: 'Каша',
    cookedYieldG: 400,
    ingredients: [
      {
        productId: oats.id,
        displayName: 'Овсянка',
        rawGrams: 100,
        nutritionPer100g: { kcal: 370, protein: 13, fat: 7, carbs: 60 },
      },
      {
        productId: mystery.id,
        displayName: 'Без этикетки',
        rawGrams: 50,
        nutritionPer100g: { kcal: null, protein: null, fat: null, carbs: null },
      },
    ],
  });

  assert.ok(recipe.id);
  assert.equal(recipe.cookedYieldG, 400);
  const ings = repo.getRecipeIngredients(recipe.id);
  assert.equal(ings.length, 2);

  const knownOnly = recipePortion(
    [
      {
        grams: 100,
        nutritionPer100g: { kcal: 370, protein: 13, fat: 7, carbs: 60 },
      },
    ],
    400,
    100,
  );
  assert.equal(knownOnly.kcal, 370 * (100 / 400));

  const withUnknown = nutritionForRecipePortion(recipe, ings, 100);
  assert.equal(withUnknown.kcal, null);
  assert.equal(formatMetricValue(withUnknown.kcal), '—');
  assert.notEqual(formatMetricValue(withUnknown.kcal), '0');

  // Manual per-100g may be all-null (unknown) — still allowed; never invent values.
  const emptyMacros = repo.createRecipe({
    name: 'Черновик без КБЖУ',
    cookedYieldG: 200,
    ingredients: [],
    nutritionPer100g: { kcal: null, protein: null, fat: null, carbs: null },
  });
  const emptyPreview = nutritionForRecipePortion(
    emptyMacros,
    repo.getRecipeIngredients(emptyMacros.id),
    100,
  );
  assert.equal(emptyPreview.kcal, null);
  assert.equal(emptyPreview.protein, null);

  repo.updateRecipe(recipe.id, { name: 'Каша утренняя', cookedYieldG: 500 });
  const updated = repo.getRecipe(recipe.id);
  assert.equal(updated.name, 'Каша утренняя');
  assert.equal(updated.cookedYieldG, 500);

  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-31',
    meal: 'breakfast',
    grams: 100,
    nutritionSnapshot: {
      energyKcal: null,
      proteinG: null,
      fatG: null,
      carbG: null,
    },
  });
  assert.equal(entry.recipeId, recipe.id);
  assert.equal(entry.energyKcal, null);

  const parsed = parseRecipeText(`Омлет
Выход: 300 г
Ингредиенты:
яйца 100 г
молоко 50 г
`);
  assert.ok(parsed.name);
  assert.equal(parsed.cookedYieldG, 300);
  assert.ok(parsed.ingredients.length >= 2);
  for (const ing of parsed.ingredients) {
    assert.equal(ing.energyKcalPer100g, null);
    assert.equal(ing.proteinGPer100g, null);
  }

  const snap = repo.toSnapshot();
  const restored = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snap });
  assert.ok(restored.getRecipe(recipe.id));
  assert.equal(restored.getRecipeIngredients(recipe.id).length, 2);
  assert.equal(restored.listEntriesForDate('2026-10-31').length, 1);

  repo.softDeleteRecipe(recipe.id);
  assert.equal(repo.getRecipe(recipe.id), null);
});

test('Phase 2 UI uses nf-fit design system; no shame copy', () => {
  const required = [
    'apps/mobile/src/features/recipes/RecipeNutritionSummary.tsx',
    'apps/mobile/src/features/recipes/RecipeHubActions.tsx',
    'apps/mobile/app/recipes/index.tsx',
    'apps/mobile/app/recipes/[id].tsx',
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }

  const summary = readFileSync(
    join(root, 'apps/mobile/src/features/recipes/RecipeNutritionSummary.tsx'),
    'utf8',
  );
  assert.ok(summary.includes('MetricCard'));
  assert.ok(summary.includes('nutritionForRecipePortion'));
  assert.ok(summary.includes('не выдуманы') || summary.includes('unknown'));
  assert.ok(!/fake kcal|стыдно|провал/i.test(summary));

  const hub = readFileSync(
    join(root, 'apps/mobile/src/features/recipes/RecipeHubActions.tsx'),
    'utf8',
  );
  assert.ok(hub.includes('@/src/design-system'));
  assert.ok(hub.includes('AppCard'));

  const index = readFileSync(join(root, 'apps/mobile/app/recipes/index.tsx'), 'utf8');
  assert.ok(index.includes('AppCard'));
  assert.ok(index.includes('@/src/design-system'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(index));

  const detail = readFileSync(join(root, 'apps/mobile/app/recipes/[id].tsx'), 'utf8');
  assert.ok(detail.includes('RecipeNutritionSummary'));
  assert.ok(detail.includes('AppButton'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(detail));
});
