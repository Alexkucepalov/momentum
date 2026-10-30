import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 1 schema: SCHEMA_VERSION 3 activates nutrition entities', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE1_ACTIVE_ENTITIES,
  } = mods['storage/migrations'];

  assert.equal(SCHEMA_VERSION, 3);
  assert.ok(PHASE1_ACTIVE_ENTITIES.includes('FoodEntry'));
  assert.ok(PHASE1_ACTIVE_ENTITIES.includes('FoodProduct'));

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
        // V2: (name, status, notes). V3: status literal 'active', params (name, notes).
        if (s.includes("'active'") || s.includes('DO UPDATE')) {
          stubs.set(params[0], { status: 'active', notes: params[1] });
        } else {
          stubs.set(params[0], { status: params[1], notes: params[2] });
        }
      }
    },
  };

  migrateExpoDb(db);
  assert.equal(getAppliedSchemaVersion(db), 3);
  assert.equal(meta.get('product'), 'nf-fit');
  assert.equal(meta.get('phase'), '1-nutrition');
  for (const name of PHASE1_ACTIVE_ENTITIES) {
    assert.ok(stubs.has(name), `missing stub ${name}`);
    assert.equal(stubs.get(name).status, 'active');
  }
});

test('Phase 1 diary vertical slice: catalog, snapshot, edit, undo, recent, favorites', () => {
  const { createMemoryFoodRepository } = mods['storage/foodRepository'];
  const { portion } = mods['domain/nutrition'];
  const { formatMetricValue } = mods['design-system/metricFormat'];
  const { COMMON_FOOD_CATALOG } = mods['domain/commonFoodCatalog'];

  assert.ok(COMMON_FOOD_CATALOG.length > 50, 'local catalog present');

  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const dateLocal = '2026-10-30';

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

  repo.setFavorite(oats.id, true);
  assert.equal(repo.listFavorites().some((p) => p.id === oats.id), true);

  const expected = portion(
    { kcal: 370, protein: 13, fat: 7, carbs: 60 },
    50,
  );
  const entry = repo.addEntryFromProduct({
    productId: oats.id,
    dateLocal,
    meal: 'breakfast',
    grams: 50,
  });
  assert.equal(entry.energyKcal, expected.kcal);
  assert.equal(entry.proteinG, expected.protein);

  // Historical entry snapshot survives product nutrition change until grams edit
  repo.updateProductNutrition(oats.id, {
    energyKcal: 999,
    proteinG: 99,
    fatG: 9,
    carbG: 90,
  });
  const still = repo.listEntriesForDate(dateLocal).find((e) => e.id === entry.id);
  assert.equal(still.energyKcal, expected.kcal);

  // Grams edit re-snapshots from current product (deterministic portion)
  repo.updateEntryGrams(entry.id, 100);
  const resized = repo.listEntriesForDate(dateLocal).find((e) => e.id === entry.id);
  assert.equal(resized.grams, 100);
  assert.equal(resized.energyKcal, 999);

  const unknownEntry = repo.addEntryFromProduct({
    productId: mystery.id,
    dateLocal,
    meal: 'snack',
    grams: 40,
  });
  assert.equal(unknownEntry.energyKcal, null);
  const totals = repo.dailyTotals(dateLocal);
  assert.equal(totals.energyKcal, null);
  assert.equal(totals.hasUnknownFields, true);
  assert.equal(formatMetricValue(totals.energyKcal), '—');
  assert.notEqual(formatMetricValue(totals.energyKcal), '0');

  repo.softDeleteEntry(unknownEntry.id);
  assert.equal(repo.listEntriesForDate(dateLocal).length, 1);
  repo.undoDeleteEntry(unknownEntry.id);
  assert.equal(repo.listEntriesForDate(dateLocal).length, 2);

  const recent = repo.listRecentEntries(8);
  assert.ok(recent.some((e) => e.productId === oats.id));

  // Offline persistence across "restart" via snapshot roundtrip
  const snap = repo.toSnapshot();
  const restored = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snap });
  assert.equal(restored.listEntriesForDate(dateLocal).length, 2);
  assert.equal(restored.listFavorites().some((p) => p.id === oats.id), true);
  const restoredOats = restored.listProducts().find((p) => p.id === oats.id);
  assert.equal(restoredOats.energyKcal, 999);
  const restoredEntry = restored.listEntriesForDate(dateLocal).find((e) => e.id === entry.id);
  assert.equal(restoredEntry.energyKcal, 999);
});

test('Phase 1 UI files use nf-fit design system', () => {
  const required = [
    'apps/mobile/src/features/diary/DiaryDaySummary.tsx',
    'apps/mobile/src/features/diary/MealSection.tsx',
    'apps/mobile/src/features/diary/FoodSegmentTabs.tsx',
    'apps/mobile/app/(tabs)/food.tsx',
    'apps/mobile/src/design-system/index.ts',
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }
  const food = readFileSync(join(root, 'apps/mobile/app/(tabs)/food.tsx'), 'utf8');
  assert.ok(food.includes('DiaryDaySummary'));
  assert.ok(food.includes('@/src/design-system'));
  assert.ok(food.includes('AppButton'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(food));

  const meal = readFileSync(
    join(root, 'apps/mobile/src/features/diary/MealSection.tsx'),
    'utf8',
  );
  assert.ok(meal.includes('AppCard'));
  assert.ok(meal.includes('пока пусто') || meal.includes('нажми, чтобы добавить'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(meal));

  const summary = readFileSync(
    join(root, 'apps/mobile/src/features/diary/DiaryDaySummary.tsx'),
    'utf8',
  );
  assert.ok(summary.includes('MetricCard'));
  assert.ok(summary.includes('unknown') || summary.includes('—') || summary.includes('никогда'));
});
