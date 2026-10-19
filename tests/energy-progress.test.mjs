import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { energyProgressRatio } = loadSrcModules()['domain/energyProgress'];

test('no energy target → zero fill (no fake progress)', () => {
  assert.equal(energyProgressRatio(10, null), 0);
  assert.equal(energyProgressRatio(500, 0), 0);
  assert.equal(energyProgressRatio(null, 2000), 0);
});

test('known food vs target clamps 0..1', () => {
  assert.equal(energyProgressRatio(0, 2000), 0);
  assert.equal(energyProgressRatio(1000, 2000), 0.5);
  assert.equal(energyProgressRatio(4000, 2000), 1);
});
