/**
 * Locks for dogfood regressions filed 2026-11-09 (#204).
 * Prefer source/contract asserts over hoping the next “UX polish” PR undoes them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// R3's fixed meal-before-repeat order is superseded by the founder's #230 request.
// The repeat path and its visibility are exercised in the browser, not source ordering.

test('R4 streak copy must not soft-shame', () => {
  const { formatFoodLogStreakRu } = mods['domain/foodLogStreak'];
  const copy = formatFoodLogStreakRu({ current: 4, loggedEndDate: true });
  assert.ok(!/достаточно|пропуск|вед[её]шь дневник/i.test(`${copy.title} ${copy.body}`));
  const domain = read('src/domain/foodLogStreak.ts');
  assert.ok(!/достаточно|Пропуск — нормально|вед[её]шь дневник/i.test(domain));
});

test('R5 mapGarminSleep prefers GMT over Local for clocks', () => {
  const { mapGarminSleepItem } = mods['domain/garmin/mapSleep'];
  // Local = wall 23:10 encoded as if Z; GMT = real UTC 20:10 → Moscow 23:10
  const row = mapGarminSleepItem({
    calendarDate: '2026-11-03',
    sleepTimeSeconds: 3600,
    sleepStartTimestampLocal: Date.parse('2026-11-03T23:10:00.000Z'),
    sleepStartTimestampGMT: Date.parse('2026-11-03T20:10:00.000Z'),
    sleepEndTimestampLocal: Date.parse('2026-11-04T07:00:00.000Z'),
    sleepEndTimestampGMT: Date.parse('2026-11-04T04:00:00.000Z'),
  });
  assert.ok(row);
  assert.equal(row.startAt, '2026-11-03T20:10:00.000Z');
  assert.equal(row.endAt, '2026-11-04T04:00:00.000Z');
  const { formatSleepClock } = mods['domain/sleepStats'];
  assert.equal(formatSleepClock(row.startAt, 'Europe/Moscow'), '23:10');
});

test('R1 GarminSyncBanner is absolute overlay (no layout push)', () => {
  const src = read('apps/mobile/src/components/GarminSyncBanner.tsx');
  assert.match(src, /position:\s*['"]absolute['"]/);
  assert.match(src, /pointerEvents=["']none["']/);
});

test('R6 useWidgetSync depends on revision', () => {
  const src = read('apps/mobile/src/widgets/useWidgetSync.ts');
  assert.match(src, /useAnyRevision/);
  assert.match(src, /\[repo,\s*revision\]/);
});
