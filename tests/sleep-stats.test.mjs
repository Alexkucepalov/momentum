import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const {
  formatSleepDuration,
  sleepHoursValue,
  sleepStagePercent,
  sleepEfficiencyPercent,
  buildSleepStageRows,
  formatSleepClock,
} = loadSrcModules()['domain/sleepStats'];

test('formatSleepDuration keeps unknown null', () => {
  assert.equal(formatSleepDuration(null), null);
  assert.equal(formatSleepDuration(-1), null);
  assert.equal(formatSleepDuration(25200), '7:00');
  assert.equal(formatSleepDuration(3661), '1:01');
});

test('sleepHoursValue', () => {
  assert.equal(sleepHoursValue(null), null);
  assert.equal(sleepHoursValue(25200), 7);
  assert.equal(sleepHoursValue(27000), 7.5);
});

test('stage percent unknown ≠ 0', () => {
  assert.equal(
    sleepStagePercent(null, { deep: 1, light: 1, rem: 1 }, 100),
    null,
  );
  const p = sleepStagePercent(3600, { deep: 3600, light: 7200, rem: 3600 }, 14400);
  assert.equal(p, 25);
});

test('efficiency', () => {
  assert.equal(sleepEfficiencyPercent(null, 100), null);
  assert.equal(sleepEfficiencyPercent(7200, 800), 90);
});

test('buildSleepStageRows preserves nulls', () => {
  const rows = buildSleepStageRows({
    sleepSec: 25200,
    deepSec: 5400,
    lightSec: 14400,
    remSec: 5400,
    awakeSec: 1200,
  });
  assert.equal(rows.length, 4);
  assert.equal(rows[0].key, 'deep');
  assert.ok(rows[0].percent != null);
  assert.equal(rows[0].durationLabel, '1:30');

  const sparse = buildSleepStageRows({
    sleepSec: 25200,
    deepSec: null,
    lightSec: null,
    remSec: null,
    awakeSec: null,
  });
  assert.ok(sparse.every((r) => r.percent == null));
  assert.ok(sparse.every((r) => r.durationLabel == null));
});

test('formatSleepClock', () => {
  assert.equal(formatSleepClock(null), null);
  const s = formatSleepClock('2026-11-03T23:10:00.000Z', 'UTC');
  assert.equal(s, '23:10');
});
