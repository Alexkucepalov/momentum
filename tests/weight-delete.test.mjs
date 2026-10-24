import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

test('softDeleteWeight hides from list and latest', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const a = repo.addWeight(72, '2026-10-20T10:00:00.000Z');
  const b = repo.addWeight(71.5, '2026-10-21T10:00:00.000Z');
  assert.equal(repo.latestWeight()?.id, b.id);
  assert.equal(repo.listWeights().length, 2);

  repo.softDeleteWeight(b.id);
  assert.equal(repo.listWeights().length, 1);
  assert.equal(repo.listWeights()[0].id, a.id);
  assert.equal(repo.latestWeight()?.id, a.id);
  assert.ok(repo.toSnapshot().weightEntries.find((w) => w.id === b.id)?.deletedAt);

  assert.throws(() => repo.softDeleteWeight(b.id), /not found/i);
});
