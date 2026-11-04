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
