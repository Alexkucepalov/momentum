import assert from 'node:assert/strict';
import test from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const { buildMonthOverview, datesEndingOn } = loadSrcModules()['domain/monthOverview'];

test('datesEndingOn returns chronological window', () => {
  assert.deepEqual(datesEndingOn('2026-11-01', 3), [
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
  ]);
});

test('month overview keeps unknown sleep/energy as null averages', () => {
  const overview = buildMonthOverview({
    days: [
      {
        dateLocal: '2026-10-30',
        foodEntryCount: 0,
        energyKcal: null,
        activityMinutes: 0,
        sleepSec: null,
      },
      {
        dateLocal: '2026-10-31',
        foodEntryCount: 2,
        energyKcal: null,
        activityMinutes: 30,
        sleepSec: 7 * 3600,
      },
      {
        dateLocal: '2026-11-01',
        foodEntryCount: 1,
        energyKcal: 2000,
        activityMinutes: 10,
        sleepSec: 8 * 3600,
      },
    ],
    weightOldestKg: 80,
    weightNewestKg: 79.2,
  });
  assert.equal(overview.foodDays, 2);
  assert.equal(overview.workoutMinutes, 40);
  assert.equal(overview.sleepKnownNights, 2);
  assert.equal(overview.sleepAvgHours, 7.5);
  assert.equal(overview.energyAvgKcal, 2000);
  assert.equal(overview.weightDeltaKg, -0.8);
});
