import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { recipePantryCoverage, formatPantryCoverageBadge } = mods['domain/recipePantryCoverage'];

test('full coverage when all ingredients match pantry names', () => {
  const c = recipePantryCoverage(
    [
      { displayName: 'Молоко' },
      { displayName: 'Хлеб' },
    ],
    [{ displayName: 'молоко' }, { displayName: 'хлеб' }],
  );
  assert.equal(c.matchedCount, 2);
  assert.equal(c.fullyCovered, true);
  assert.equal(c.ratio, 1);
  assert.equal(formatPantryCoverageBadge(c), '2/2 дома');
});

test('partial name mismatch stays missing (no fuzzy invent)', () => {
  const c = recipePantryCoverage(
    [{ displayName: 'Хлеб' }],
    [{ displayName: 'Хлеб белый' }],
  );
  assert.equal(c.matchedCount, 0);
  assert.deepEqual(c.missing, ['Хлеб']);
});

test('productId match counts as available', () => {
  const c = recipePantryCoverage(
    [{ displayName: 'Творог', productId: 'p1' }],
    [{ displayName: 'Other', productId: 'p1' }],
  );
  assert.equal(c.fullyCovered, true);
  assert.equal(c.ratio, 1);
});

test('empty ingredients → null ratio, not fake 100%', () => {
  const c = recipePantryCoverage([], [{ displayName: 'Молоко' }]);
  assert.equal(c.ratio, null);
  assert.equal(c.fullyCovered, false);
  assert.equal(formatPantryCoverageBadge(c), null);
});

test('empty pantry → all missing', () => {
  const c = recipePantryCoverage([{ displayName: 'Рис' }, { displayName: 'Соль' }], []);
  assert.equal(c.matchedCount, 0);
  assert.equal(c.missing.length, 2);
  assert.equal(c.ratio, 0);
});
