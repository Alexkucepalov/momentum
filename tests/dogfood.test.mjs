import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { dogfoodStatus, daysInclusive, DOGFOOD_DAYS } = loadSrcModules()['domain/dogfood'];
const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

test('daysInclusive counts calendar days', () => {
  assert.equal(daysInclusive('2026-10-01', '2026-10-01'), 1);
  assert.equal(daysInclusive('2026-10-01', '2026-10-14'), 14);
  assert.equal(daysInclusive('2026-10-01', '2026-09-30'), 1); // clamp
});

test('dogfoodStatus before start', () => {
  const s = dogfoodStatus(null, '2026-10-17');
  assert.equal(s.dayNumber, null);
  assert.equal(s.gateReached, false);
  assert.equal(s.daysTotal, DOGFOOD_DAYS);
});

test('dogfoodStatus reaches gate on day 14', () => {
  const s = dogfoodStatus('2026-10-04', '2026-10-17');
  assert.equal(s.dayNumber, 14);
  assert.equal(s.gateReached, true);
});

test('repository persists dogfood start in snapshot v5', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  assert.equal(repo.dogfoodStatus('2026-10-17').startedOn, null);
  repo.startDogfood('2026-10-10');
  assert.equal(repo.dogfoodStatus('2026-10-17').dayNumber, 8);
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 9);
  assert.equal(snap.profile.dogfoodStartedOn, '2026-10-10');
  const restored = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(restored.dogfoodStatus('2026-10-17').dayNumber, 8);
  restored.clearDogfood();
  assert.equal(restored.getProfile().dogfoodStartedOn, null);
});
