import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { mealSlotForNow } = loadSrcModules()['domain/mealSlotForNow'];

test('mealSlotForNow by hour', () => {
  assert.equal(mealSlotForNow(new Date(2026, 0, 1, 8, 0, 0)), 'breakfast');
  assert.equal(mealSlotForNow(new Date(2026, 0, 1, 12, 0, 0)), 'lunch');
  assert.equal(mealSlotForNow(new Date(2026, 0, 1, 19, 0, 0)), 'dinner');
  assert.equal(mealSlotForNow(new Date(2026, 0, 1, 22, 0, 0)), 'snack');
});
