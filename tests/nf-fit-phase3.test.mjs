import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 3 schema: SCHEMA_VERSION 5 activates UserProfile + WaterEntry', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE3_ACTIVE_ENTITIES,
  } = mods['storage/migrations'];

  assert.ok(SCHEMA_VERSION >= 5);
  assert.deepEqual([...PHASE3_ACTIVE_ENTITIES], ['UserProfile', 'WaterEntry']);

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
  for (const name of PHASE3_ACTIVE_ENTITIES) {
    assert.ok(stubs.has(name), `missing stub ${name}`);
    assert.equal(stubs.get(name).status, 'active');
  }
});

test('Phase 3 Today+Profile: water, goals, export/import/delete, unknown energy', () => {
  const { createMemoryFoodRepository } = mods['storage/foodRepository'];
  const { formatMetricValue } = mods['design-system/metricFormat'];

  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const dateLocal = '2026-10-31';

  // Empty day: energy unknown for UI (null totals), not fabricated 0
  let totals = repo.dailyTotals(dateLocal);
  assert.equal(totals.entryCount, 0);
  assert.equal(formatMetricValue(totals.entryCount === 0 ? null : totals.energyKcal), '—');

  repo.setWaterTargetMl(2000);
  assert.equal(repo.getProfile().waterTargetMl, 2000);

  repo.setDailyNutritionTargets({
    energyKcal: 2200,
    proteinG: 120,
    fatG: 70,
    carbG: null,
  });
  const profile = repo.getProfile();
  assert.equal(profile.dailyEnergyKcal, 2200);
  assert.equal(profile.dailyCarbG, null);

  repo.addWater(dateLocal, 250);
  repo.addWater(dateLocal, 250);
  assert.equal(repo.waterMlForDate(dateLocal), 500);
  assert.equal(repo.listWaterForDate(dateLocal).length, 2);

  const oats = repo.createProduct({
    name: 'Овсянка',
    energyKcal: 370,
    proteinG: 13,
    fatG: 7,
    carbG: 60,
    source: 'catalog',
  });
  repo.addEntryFromProduct({
    productId: oats.id,
    dateLocal,
    meal: 'breakfast',
    grams: 50,
  });
  totals = repo.dailyTotals(dateLocal);
  assert.ok(totals.energyKcal != null);
  assert.equal(totals.hasUnknownFields, false);

  const mystery = repo.createProduct({
    name: 'Без этикетки',
    energyKcal: null,
    proteinG: null,
    fatG: null,
    carbG: null,
    source: 'missing',
  });
  repo.addEntryFromProduct({
    productId: mystery.id,
    dateLocal,
    meal: 'snack',
    grams: 30,
  });
  totals = repo.dailyTotals(dateLocal);
  assert.equal(totals.energyKcal, null);
  assert.equal(totals.hasUnknownFields, true);
  assert.equal(formatMetricValue(totals.energyKcal), '—');

  const exported = repo.exportAll();
  assert.ok(typeof exported === 'string' && exported.includes('"'));

  const snap = repo.toSnapshot();
  const restored = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snap });
  assert.equal(restored.getProfile().waterTargetMl, 2000);
  assert.equal(restored.waterMlForDate(dateLocal), 500);
  assert.equal(restored.listEntriesForDate(dateLocal).length, 2);

  restored.importAll(exported);
  assert.equal(restored.getProfile().dailyEnergyKcal, 2200);

  restored.deleteAllUserData();
  assert.equal(restored.listEntriesForDate(dateLocal).length, 0);
  assert.equal(restored.waterMlForDate(dateLocal), 0);
});

test('Phase 3 UI uses nf-fit design system; no shame copy', () => {
  const required = [
    'apps/mobile/src/features/today/TodayStatusSummary.tsx',
    'apps/mobile/src/components/StatCards.tsx',
    'apps/mobile/app/(tabs)/index.tsx',
    'apps/mobile/app/(tabs)/profile.tsx',
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }

  const today = readFileSync(join(root, 'apps/mobile/app/(tabs)/index.tsx'), 'utf8');
  // Stage 4.1 fold: KcalRing + StatCards (water/activity); TodayStatusSummary kept as module.
  assert.ok(today.includes('KcalRing'));
  assert.ok(today.includes('StatCards'));
  assert.ok(today.includes('FoodLogStreakCard'), 'gentle food-log streak on Today');
  assert.ok(today.includes('TodayRecentStrip'), 'recent strip above fold on Today for ≤10s repeat');
  assert.ok(today.includes('listRecentEntries(6)'), 'shows up to 6 recent entries');
  assert.ok(!today.includes('listFavorites'), 'favorites live on Food, not Today');
  assert.ok(today.includes('@/src/design-system'));
  assert.ok(today.includes('AppButton'));
  assert.ok(today.includes('План питания'), 'Plan entry in header');
  assert.ok(!today.includes('TodayActivityCard'), 'activity detail demoted off Today fold');
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(today));

  const summary = readFileSync(
    join(root, 'apps/mobile/src/features/today/TodayStatusSummary.tsx'),
    'utf8',
  );
  assert.ok(summary.includes('MetricCard'));
  assert.ok(summary.includes('entryCount === 0'));

  const profile = readFileSync(join(root, 'apps/mobile/app/(tabs)/profile.tsx'), 'utf8');
  assert.ok(profile.includes('AppCard'));
  assert.ok(profile.includes('AppButton'));
  assert.ok(profile.includes('nf-fit'));
  assert.ok(profile.includes('Приватность') || profile.includes('privacy'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(profile));
});
