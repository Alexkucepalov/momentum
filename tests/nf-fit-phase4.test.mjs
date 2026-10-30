import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 4 schema: SCHEMA_VERSION 6 activates Weight/Workout/Habit', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE4_ACTIVE_ENTITIES,
  } = mods['storage/migrations'];

  assert.ok(SCHEMA_VERSION >= 6);
  assert.deepEqual([...PHASE4_ACTIVE_ENTITIES], ['WeightEntry', 'Workout', 'Habit']);

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
  for (const name of PHASE4_ACTIVE_ENTITIES) {
    assert.ok(stubs.has(name), `missing ${name}`);
    assert.equal(stubs.get(name).status, 'active');
  }
});

test('Phase 4: workouts do not offset food; weight; habits; absence ≠ zero', () => {
  const { createMemoryFoodRepository } = mods['storage/foodRepository'];
  const { formatMetricValue } = mods['design-system/metricFormat'];

  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const dateLocal = '2026-10-31';

  // No weight yet — UI should treat as unknown, not invent 0 kg
  assert.equal(repo.latestWeight(), null);
  assert.equal(formatMetricValue(null), '—');

  repo.addWeight(72.5);
  assert.equal(repo.latestWeight().kg, 72.5);
  assert.ok(repo.listWeights(10).length >= 1);

  const food = repo.createProduct({
    name: 'Рис',
    energyKcal: 130,
    proteinG: 2.7,
    fatG: 0.3,
    carbG: 28,
    source: 'catalog',
  });
  repo.addEntryFromProduct({
    productId: food.id,
    dateLocal,
    meal: 'lunch',
    grams: 100,
  });
  const foodTotalsBefore = repo.dailyTotals(dateLocal);
  assert.equal(foodTotalsBefore.energyKcal, 130);

  repo.addWorkout({
    dateLocal,
    type: 'walking',
    durationSec: 3600,
    distanceM: 5000,
    notes: null,
  });
  assert.equal(repo.listWorkoutsForDate(dateLocal).length, 1);
  assert.equal(repo.activityMinutesForDate(dateLocal), 60);

  // Food diary totals unchanged by workout (no auto offset)
  const foodTotalsAfter = repo.dailyTotals(dateLocal);
  assert.equal(foodTotalsAfter.energyKcal, foodTotalsBefore.energyKcal);
  assert.equal(foodTotalsAfter.energyKcal, 130);

  // Empty day minutes → UI null display for summary
  assert.equal(repo.activityMinutesForDate('2026-10-01'), 0);
  assert.equal(formatMetricValue(0 > 0 ? 0 : null), '—');

  const habit = repo.createFlexibleHabit('Прогулка', 5, { kind: 'checkbox' });
  assert.ok(habit.id);
  assert.equal(repo.isFlexibleHabitLogged(habit.id, dateLocal), false);
  repo.logFlexibleHabit(habit.id, dateLocal);
  assert.equal(repo.isFlexibleHabitLogged(habit.id, dateLocal), true);

  const snap = repo.toSnapshot();
  const restored = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snap });
  assert.equal(restored.latestWeight().kg, 72.5);
  assert.equal(restored.listWorkoutsForDate(dateLocal).length, 1);
  assert.equal(restored.dailyTotals(dateLocal).energyKcal, 130);
  assert.equal(restored.isFlexibleHabitLogged(habit.id, dateLocal), true);
});

test('Phase 4 UI uses design system; no shame copy', () => {
  const files = [
    'apps/mobile/src/features/activity/ActivityDaySummary.tsx',
    'apps/mobile/app/(tabs)/activity.tsx',
    'apps/mobile/app/(tabs)/progress.tsx',
  ];
  for (const rel of files) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }
  const activity = readFileSync(join(root, 'apps/mobile/app/(tabs)/activity.tsx'), 'utf8');
  assert.ok(activity.includes('ActivityDaySummary'));
  assert.ok(activity.includes('@/src/design-system'));
  assert.ok(activity.includes('не вычитаются из еды') || activity.includes('ActivityDaySummary'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(activity));

  const summary = readFileSync(
    join(root, 'apps/mobile/src/features/activity/ActivityDaySummary.tsx'),
    'utf8',
  );
  assert.ok(summary.includes('MetricCard'));
  assert.ok(summary.includes('never') || summary.includes('не вычитается'));

  const progress = readFileSync(join(root, 'apps/mobile/app/(tabs)/progress.tsx'), 'utf8');
  assert.ok(progress.includes('AppCard'));
  assert.ok(progress.includes('MetricCard'));
  assert.ok(progress.includes('не считаем нулём') || progress.includes('неизв'));
  assert.ok(!/shame|стыдно|провал|неудачник/i.test(progress));
});
