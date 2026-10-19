import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  assertReportPeriod,
  datesInInclusiveRange,
  buildFlexibleReport,
  flexibleReportToHtml,
} = mods['domain/flexibleReport'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('report period validation', () => {
  assert.throws(() => assertReportPeriod('nope', '2026-10-01'), /формате/);
  assert.throws(() => assertReportPeriod('2026-10-10', '2026-10-01'), /раньше/);
  assert.equal(datesInInclusiveRange('2026-10-01', '2026-10-03').length, 3);
});

test('buildFlexibleReport keeps unknown kcal unknown', () => {
  const report = buildFlexibleReport({
    periodStart: '2026-10-01',
    periodEnd: '2026-10-03',
    categories: ['profile', 'nutrition'],
    generatedAtIso: '2026-10-18T12:00:00.000Z',
    profile: {
      timezone: 'UTC',
      heightCm: 175,
      waterTargetMl: 2000,
      dailyEnergyKcal: 2200,
      dailyProteinG: 120,
      dailyFatG: null,
      dailyCarbG: 200,
    },
    latestWeightKg: 76.4,
    nutritionDays: [
      {
        dateLocal: '2026-10-01',
        entryCount: 2,
        energyKcal: null,
        proteinG: 10,
        fatG: null,
        carbG: 20,
        hasUnknownFields: true,
      },
      {
        dateLocal: '2026-10-02',
        entryCount: 0,
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbG: null,
        hasUnknownFields: false,
      },
    ],
    workouts: [],
    weights: [],
    habits: [],
  });
  assert.match(report.periodLabel, /01\.10\.2026/);
  assert.match(report.periodLabel, /03\.10\.2026/);
  const nutrition = report.sections.find((s) => s.id === 'nutrition');
  assert.ok(nutrition);
  assert.ok(nutrition.summary.some((l) => /неизвестн/i.test(l)));
  assert.ok(nutrition.details.some((l) => /01\.10\.2026/));
  assert.ok(!nutrition.summary.some((l) => /Сумма ккал \(известные дни\)/i.test(l) && !/—/.test(l)));
  const avgKpi = report.kpis.find((k) => /Среднее ккал/i.test(k.label));
  assert.ok(avgKpi);
  assert.equal(avgKpi.value, '—');
  const html = flexibleReportToHtml(report, '2026-10-18T12:00:00.000Z');
  assert.match(html, /Momentum/);
  assert.match(html, /kpi-grid/);
  assert.match(html, /Сводка периода/);
  assert.doesNotMatch(html, /<script/i);
});

test('dashboard KPIs: weight delta and avg kcal over known days', () => {
  const report = buildFlexibleReport({
    periodStart: '2026-10-01',
    periodEnd: '2026-10-05',
    categories: ['nutrition', 'weight', 'activity'],
    generatedAtIso: '2026-10-18T12:00:00.000Z',
    profile: {
      timezone: 'UTC',
      heightCm: null,
      waterTargetMl: null,
      dailyEnergyKcal: null,
      dailyProteinG: null,
      dailyFatG: null,
      dailyCarbG: null,
    },
    latestWeightKg: 75,
    nutritionDays: [
      {
        dateLocal: '2026-10-01',
        entryCount: 1,
        energyKcal: 2000,
        proteinG: 100,
        fatG: 60,
        carbG: 200,
        hasUnknownFields: false,
      },
      {
        dateLocal: '2026-10-02',
        entryCount: 1,
        energyKcal: 1800,
        proteinG: 90,
        fatG: 50,
        carbG: 180,
        hasUnknownFields: false,
      },
      {
        dateLocal: '2026-10-03',
        entryCount: 1,
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbG: null,
        hasUnknownFields: true,
      },
    ],
    workouts: [
      { dateLocal: '2026-10-01', type: 'walk', durationMin: 40, distanceM: 3000, notes: null },
      { dateLocal: '2026-10-03', type: 'strength', durationMin: 50, distanceM: null, notes: null },
    ],
    weights: [
      { dateLocal: '2026-10-01', kg: 76.0 },
      { dateLocal: '2026-10-05', kg: 75.2 },
    ],
    habits: [],
  });

  const weightKpi = report.kpis.find((k) => k.label === 'Вес за период');
  assert.ok(weightKpi);
  assert.match(weightKpi.value, /76\.0 → 75\.2/);
  assert.match(weightKpi.hint ?? '', /-0\.8/);

  const avgKpi = report.kpis.find((k) => /Среднее ккал/i.test(k.label));
  assert.ok(avgKpi);
  assert.equal(avgKpi.value, '1900');
  assert.match(avgKpi.hint ?? '', /2 дням/);

  const nutrition = report.sections.find((s) => s.id === 'nutrition');
  assert.ok(nutrition.summary.some((l) => /Среднее ккал\/день \(полные данные\): 1900/));
  assert.ok(nutrition.details.length >= 3);

  const html = flexibleReportToHtml(report, '2026-10-18T12:00:00.000Z');
  assert.match(html, /Подробности/);
  assert.match(html, /76\.0 → 75\.2/);
});

test('empty categories rejected', () => {
  assert.throws(
    () =>
      buildFlexibleReport({
        periodStart: '2026-10-01',
        periodEnd: '2026-10-01',
        categories: [],
        generatedAtIso: '2026-10-18T12:00:00.000Z',
        profile: {
          timezone: 'UTC',
          heightCm: null,
          waterTargetMl: null,
          dailyEnergyKcal: null,
          dailyProteinG: null,
          dailyFatG: null,
          dailyCarbG: null,
        },
        latestWeightKg: null,
        nutritionDays: [],
        workouts: [],
        weights: [],
        habits: [],
      }),
    /категор/,
  );
});

test('habit day value feeds quantity sum', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const h = repo.createFlexibleHabit('Walk', 7, {
    kind: 'quantity',
    unit: 'мин',
    targetValue: 150,
  });
  repo.logFlexibleHabit(h.id, '2026-10-13', 40);
  repo.logFlexibleHabit(h.id, '2026-10-14', 20);
  assert.equal(repo.flexibleHabitDayValue(h.id, '2026-10-13'), 40);
  assert.equal(repo.flexibleHabitDayValue(h.id, '2026-10-15'), 0);
});
