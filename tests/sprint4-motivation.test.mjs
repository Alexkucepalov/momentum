import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository, weekStartMonday } = mods['storage/foodRepository'];
const { buildWeeklyInsight, collectWeeklyInsightStats } = mods['domain/weeklyInsight'];
const { formatHabitWeekLabel } = mods['domain/habitWeek'];
const { parseExportJson } = mods['domain/importExport'];

test('snapshot migrates to v9 with quantity habit defaults', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const habit = repo.createFlexibleHabit('Stretch', 3);
  assert.equal(habit.kind, 'checkbox');
  assert.equal(habit.unit, null);
  assert.equal(habit.targetValue, null);
  assert.equal(habit.autoSource, null);
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 14);
  assert.ok(Array.isArray(snap.challenges));
  const restored = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(restored.listFlexibleHabits()[0].kind, 'checkbox');
});

test('quantity habit sums values toward weekly target', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const habit = repo.createFlexibleHabit('Walk mins', 7, {
    kind: 'quantity',
    unit: 'мин',
    targetValue: 150,
  });
  repo.logFlexibleHabit(habit.id, '2026-10-13', 40);
  repo.logFlexibleHabit(habit.id, '2026-10-13', 20);
  repo.logFlexibleHabit(habit.id, '2026-10-15', 30);
  const stats = repo.flexibleHabitWeekStats(habit.id, '2026-10-17');
  assert.equal(stats.kind, 'quantity');
  assert.equal(stats.unit, 'мин');
  assert.equal(stats.completed, 90);
  assert.equal(stats.target, 150);
  assert.match(formatHabitWeekLabel(90, 150, 'мин'), /мин/);
});

test('workout auto-credits matching habit once per day', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const habit = repo.createFlexibleHabit('Любая активность', 3, {
    autoSource: 'any_workout',
  });
  repo.addWorkout({
    dateLocal: '2026-10-17',
    type: 'walking',
    durationSec: 1800,
  });
  assert.equal(repo.isFlexibleHabitLogged(habit.id, '2026-10-17'), true);
  const before = repo.flexibleHabitWeekStats(habit.id, '2026-10-17').completed;
  repo.addWorkout({
    dateLocal: '2026-10-17',
    type: 'cycling',
    durationSec: 600,
  });
  assert.equal(repo.flexibleHabitWeekStats(habit.id, '2026-10-17').completed, before);
});

test('personal challenge tracks workouts without shame copy', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const c = repo.createChallenge({
    name: '3 тренировки',
    metric: 'workouts_count',
    target: 3,
    periodStart: '2026-10-12',
    periodEnd: '2026-10-25',
  });
  repo.addWorkout({ dateLocal: '2026-10-13', type: 'strength', durationSec: 1200 });
  repo.addWorkout({ dateLocal: '2026-10-14', type: 'walking', durationSec: 900 });
  let p = repo.challengeProgress(c.id);
  assert.equal(p.current, 2);
  assert.equal(p.status, 'active');
  repo.addWorkout({ dateLocal: '2026-10-15', type: 'cycling', durationSec: 600 });
  p = repo.challengeProgress(c.id);
  assert.equal(p.current, 3);
  assert.equal(p.status, 'completed');
  assert.equal(p.ratio, 1);
});

test('weekly insight keeps unknown energy as unknown', () => {
  const insight = buildWeeklyInsight({
    endDateLocal: '2026-10-18',
    foodDaysLogged: 2,
    entryCount: 5,
    energyKcalSum: null,
    energyHasUnknown: true,
    activityMinutes: 40,
    workoutsCount: 1,
    habitCompletions: 2,
    habitTargetsSum: 3,
    challengesActive: 1,
    challengesCompleted: 0,
  });
  assert.equal(insight.weekStart, weekStartMonday('2026-10-18'));
  assert.ok(insight.lines.some((l) => /неизвестна/i.test(l)));
  assert.ok(!insight.lines.some((l) => /провал|штраф|сорван/i.test(l)));

  const collected = collectWeeklyInsightStats({
    endDateLocal: '2026-10-18',
    dailyTotals: () => ({ energyKcal: null, entryCount: 1, hasUnknownFields: true }),
    activityMinutesForDate: () => 0,
    workoutsForDate: () => 0,
    habitWeekStats: () => [],
    challenges: () => [],
  });
  assert.ok(collected.lines.some((l) => /неизвестна/i.test(l)));
});

test('import export accepts snapshot v9', () => {
  const ok = parseExportJson(
    JSON.stringify({
      version: 9,
      profile: { id: 'x', timezone: 'UTC', locale: 'ru', units: 'metric' },
      products: [],
      recipes: [],
      entries: [],
      ingredients: [],
      challenges: [],
    }),
  );
  assert.equal(ok.ok, true);
});
