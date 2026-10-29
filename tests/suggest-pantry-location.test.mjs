import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { suggestPantryLocation } = loadSrcModules()['domain/suggestPantryLocation'];

test('suggestPantryLocation: dairy and produce → fridge', () => {
  assert.equal(suggestPantryLocation('Молоко Домик в деревне 3,2%'), 'fridge');
  assert.equal(suggestPantryLocation('Бананы вес'), 'fridge');
  assert.equal(suggestPantryLocation('Творог 5%'), 'fridge');
});

test('suggestPantryLocation: frozen → freezer', () => {
  assert.equal(suggestPantryLocation('Пельмени замороженные'), 'freezer');
  assert.equal(suggestPantryLocation('Филе куриное зам.'), 'freezer');
});

test('suggestPantryLocation: dry goods → pantry (шкаф)', () => {
  assert.equal(suggestPantryLocation('Хлеб Бородинский нарезка'), 'pantry');
  assert.equal(suggestPantryLocation('Гречка'), 'pantry');
  assert.equal(suggestPantryLocation('Рис круглозёрный'), 'pantry');
});
