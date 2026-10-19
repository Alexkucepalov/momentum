import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { parseNutritionLabelText } = loadSrcModules()['domain/parseNutritionLabel'];

test('parses Russian per-100g nutrition block', () => {
  const parsed = parseNutritionLabelText(`
Йогурт натуральный
Пищевая ценность на 100 г
Энергетическая ценность 72 ккал
Белки 4,3 г
Жиры 3,2 г
Углеводы 5,5 г
`);
  assert.equal(parsed.name, 'Йогурт натуральный');
  assert.equal(parsed.energyKcal, 72);
  assert.equal(parsed.proteinG, 4.3);
  assert.equal(parsed.fatG, 3.2);
  assert.equal(parsed.carbG, 5.5);
  assert.deepEqual(parsed.foundFields, ['name', 'energyKcal', 'proteinG', 'fatG', 'carbG']);
});

test('missing macros stay null, not zero', () => {
  const parsed = parseNutritionLabelText('Snack bar\nEnergy 210 kcal\nProtein 8 g');
  assert.equal(parsed.energyKcal, 210);
  assert.equal(parsed.proteinG, 8);
  assert.equal(parsed.fatG, null);
  assert.equal(parsed.carbG, null);
});

test('empty text invents nothing', () => {
  const parsed = parseNutritionLabelText('   ');
  assert.equal(parsed.name, null);
  assert.equal(parsed.energyKcal, null);
  assert.equal(parsed.foundFields.length, 0);
});
