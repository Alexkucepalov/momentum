import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { parseRecipeText, parseIngredientLine } = mods['domain/parseRecipeText'];

test('parseIngredientLine extracts grams without inventing macros', () => {
  const a = parseIngredientLine('- куриная грудка — 200 г');
  assert.equal(a.rawGrams, 200);
  assert.match(a.displayName, /куриная/i);
  assert.equal(a.energyKcalPer100g, null);

  const b = parseIngredientLine('200 г овсянки');
  assert.equal(b.rawGrams, 200);
  assert.match(b.displayName, /овсян/i);

  const c = parseIngredientLine('яйцо 2 шт');
  assert.equal(c.rawGrams, null);
  assert.match(c.displayName, /яйцо/i);
});

test('parseRecipeText builds draft from structured RU paste', () => {
  const text = `Овсянка с ягодами
Выход: 350 г

Ингредиенты:
- овсянка 60 г
- молоко 200 г
- черника 50 г

Приготовление:
Сварить кашу и добавить ягоды.`;

  const parsed = parseRecipeText(text);
  assert.equal(parsed.name, 'Овсянка с ягодами');
  assert.equal(parsed.cookedYieldG, 350);
  assert.equal(parsed.ingredients.length, 3);
  assert.equal(parsed.ingredients[0].rawGrams, 60);
  assert.equal(parsed.ingredients[0].proteinGPer100g, null);
  assert.match(parsed.instructions ?? '', /Сварить/);
  assert.ok(parsed.warnings.every((w) => !/Пустой/.test(w)));
});

test('parseRecipeText does not invent kcal; empty text warns', () => {
  assert.equal(parseRecipeText('').ingredients.length, 0);
  assert.ok(parseRecipeText('').warnings.some((w) => /Пустой/.test(w)));

  const chatty = `Боул
лосось 120 г
рис 80г
огурец`;
  const p = parseRecipeText(chatty);
  assert.equal(p.name, 'Боул');
  assert.ok(p.ingredients.length >= 2);
  assert.ok(p.ingredients.every((i) => i.energyKcalPer100g == null));
  assert.ok(p.ingredients.some((i) => i.rawGrams == null));
});

test('parseRecipeText pairs diary macro lines and reads Итого yield', () => {
  const text = `Куриная грудка — 180 г
297 ккал · Б 55,8 г · Ж 6,5 г · У 0 г

Рис варёный — 160 г
208 ккал · Б 4,3 г · Ж 0,5 г · У 45,1 г

Мексиканская смесь — 150 г
110 ккал · Б 2 г · У 19,9 г

Итого на весь контейнер — 490 г:
615 ккал · Б 65 г · Ж 9 г · У 65 г`;

  const p = parseRecipeText(text);
  assert.equal(p.cookedYieldG, 490);
  assert.equal(p.ingredients.length, 3);
  assert.equal(p.ingredients[0].displayName, 'Куриная грудка');
  assert.equal(p.ingredients[0].rawGrams, 180);
  assert.equal(p.ingredients[0].energyKcalPer100g, 165);
  assert.equal(p.ingredients[0].proteinGPer100g, 31);
  assert.equal(p.ingredients[0].fatGPer100g, 3.6);
  assert.equal(p.ingredients[0].carbGPer100g, 0);
  assert.equal(p.ingredients[1].displayName, 'Рис варёный');
  assert.equal(p.ingredients[1].rawGrams, 160);
  assert.equal(p.ingredients[1].energyKcalPer100g, 130);
  assert.equal(p.ingredients[2].displayName, 'Мексиканская смесь');
  assert.equal(p.ingredients[2].rawGrams, 150);
  assert.equal(p.ingredients[2].energyKcalPer100g, 73);
  assert.equal(p.ingredients[2].proteinGPer100g, 1.3);
  assert.equal(p.ingredients[2].fatGPer100g, null);
  assert.equal(p.ingredients[2].carbGPer100g, 13.3);
  assert.ok(!p.warnings.some((w) => /Выход/.test(w)));
});

test('isMacroSummaryLine rejects diary KBJU rows as ingredients', () => {
  const { isMacroSummaryLine } = mods['domain/parseRecipeText'];
  assert.equal(isMacroSummaryLine('297 ккал · Б 55,8 г · Ж 6,5 г · У 0 г'), true);
  assert.equal(isMacroSummaryLine('Куриная грудка — 180 г'), false);
  assert.equal(parseIngredientLine('297 ккал · Б 55,8 г · Ж 6,5 г · У 0 г'), null);
});
