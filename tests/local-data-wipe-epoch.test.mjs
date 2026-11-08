import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { getLocalDataWipeEpoch, bumpLocalDataWipeEpoch } = mods['domain/localDataWipeEpoch'];

test('wipe epoch starts at 0 and bumps monotonically', () => {
  const before = getLocalDataWipeEpoch();
  const next = bumpLocalDataWipeEpoch();
  assert.equal(next, before + 1);
  assert.equal(getLocalDataWipeEpoch(), next);
  const next2 = bumpLocalDataWipeEpoch();
  assert.equal(next2, next + 1);
});
