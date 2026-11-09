import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const { foodLogStreak, formatFoodLogStreakRu } = loadSrcModules()['domain/foodLogStreak'];

test('foodLogStreak counts consecutive days ending at endDate', () => {
  const logged = new Set(['2026-11-02', '2026-11-03', '2026-11-04']);
  const streak = foodLogStreak({
    endDateLocal: '2026-11-04',
    hasLog: (d) => logged.has(d),
  });
  assert.equal(streak.current, 3);
  assert.equal(streak.loggedEndDate, true);
});

test('foodLogStreak breaks on a gap', () => {
  const logged = new Set(['2026-11-01', '2026-11-03', '2026-11-04']);
  const streak = foodLogStreak({
    endDateLocal: '2026-11-04',
    hasLog: (d) => logged.has(d),
  });
  assert.equal(streak.current, 2);
});

test('formatFoodLogStreakRu stays non-judgmental at zero', () => {
  const copy = formatFoodLogStreakRu({ current: 0, loggedEndDate: false });
  assert.match(copy.body, /начнётся|счётчик/i);
  assert.ok(!/стыд|провал|неудач/i.test(`${copy.title} ${copy.body}`));
});

test('formatFoodLogStreakRu avoids soft-shame copy on active streak', () => {
  const copy = formatFoodLogStreakRu({ current: 5, loggedEndDate: true });
  assert.match(copy.title, /5/);
  assert.ok(!/достаточно|пропуск|вед[её]шь дневник/i.test(copy.body));
});

test('formatSleepClock prefers non-UTC zone for MSK wall clock', async () => {
  const { formatSleepClock } = loadSrcModules()['domain/sleepStats'];
  const s = formatSleepClock('2026-11-03T20:10:00.000Z', 'Europe/Moscow');
  assert.equal(s, '23:10');
});
