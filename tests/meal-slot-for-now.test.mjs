import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { mealSlotForNow } = loadSrcModules()['domain/mealSlotForNow'];

function at(h, m = 0) {
  return new Date(2026, 0, 1, h, m, 0, 0);
}

test('mealSlotForNow mid-slot hours', () => {
  assert.equal(mealSlotForNow(at(8)), 'breakfast');
  assert.equal(mealSlotForNow(at(12)), 'lunch');
  assert.equal(mealSlotForNow(at(19)), 'dinner');
  assert.equal(mealSlotForNow(at(22)), 'snack');
});

test('mealSlotForNow inclusive lower bounds and exclusive upper', () => {
  assert.equal(mealSlotForNow(at(0, 0)), 'breakfast');
  assert.equal(mealSlotForNow(at(10, 59)), 'breakfast');
  assert.equal(mealSlotForNow(at(11, 0)), 'lunch');
  assert.equal(mealSlotForNow(at(15, 59)), 'lunch');
  assert.equal(mealSlotForNow(at(16, 0)), 'dinner');
  assert.equal(mealSlotForNow(at(20, 59)), 'dinner');
  assert.equal(mealSlotForNow(at(21, 0)), 'snack');
  assert.equal(mealSlotForNow(at(23, 59)), 'snack');
});

test('mealSlotForNow uses local clock hours (not UTC reinterpret)', () => {
  const local = at(14, 30);
  assert.equal(local.getHours(), 14);
  assert.equal(mealSlotForNow(local), 'lunch');
});
