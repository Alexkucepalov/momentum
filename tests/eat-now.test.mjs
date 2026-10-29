import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { remainingMacros, remainingField, hasAnyKnownRemaining } = mods['domain/remainingMacros'];
const { suggestEatNowPortionGrams, computeFitScore, scoreEatNow } = mods['domain/scoreEatNow'];

test('remainingField: unknown ≠ 0', () => {
  assert.equal(remainingField(null, 100), null);
  assert.equal(remainingField(2000, null), null);
  assert.equal(remainingField(2000, 1520), 480);
  assert.equal(remainingField(2000, 2100), -100);
});

test('remainingMacros incomplete when any field unknown', () => {
  const r = remainingMacros(
    { energyKcal: 2000, proteinG: 150, fatG: null, carbG: 200 },
    { energyKcal: 1520, proteinG: 115, fatG: 40, carbG: 150 },
  );
  assert.equal(r.energyKcal, 480);
  assert.equal(r.proteinG, 35);
  assert.equal(r.fatG, null);
  assert.equal(r.carbG, 50);
  assert.equal(r.incomplete, true);
});

test('suggest portion from remaining energy', () => {
  const g = suggestEatNowPortionGrams(
    { kcal: 120, protein: 10, fat: 5, carbs: 8 },
    { energyKcal: 480, proteinG: 35, fatG: 15, carbG: 50 },
  );
  // remaining ≤ meal cap → use full remaining for the sitting
  assert.equal(g, 400); // 480/120*100 = 400
});

test('suggest portion caps large day remaining to one meal', () => {
  const { mealEnergyBudgetKcal } = mods['domain/scoreEatNow'];
  assert.equal(mealEnergyBudgetKcal(2200), 700);
  const g = suggestEatNowPortionGrams(
    { kcal: 370, protein: 13, fat: 7, carbs: 60 },
    { energyKcal: 2200, proteinG: 150, fatG: 70, carbG: 220 },
  );
  // 700/370*100 ≈ 189 — not ~500g / 1850 kcal of the whole day
  assert.equal(g, 189);
  assert.ok(g * 3.7 < 800);
});

test('suggest portion when already over energy still returns small snack', () => {
  const g = suggestEatNowPortionGrams(
    { kcal: 100, protein: 20, fat: 2, carbs: 5 },
    { energyKcal: -50, proteinG: 10, fatG: 5, carbG: 10 },
  );
  assert.equal(g, 80);
});

test('reject negative grams in suggest', () => {
  assert.throws(() =>
    suggestEatNowPortionGrams(
      { kcal: -1, protein: null, fat: null, carbs: null },
      { energyKcal: 100, proteinG: null, fatG: null, carbG: null },
    ),
  );
});

test('fitScore null when no shared known macros', () => {
  assert.equal(
    computeFitScore(
      { energyKcal: null, proteinG: null, fatG: null, carbG: null },
      { energyKcal: 480, proteinG: 35, fatG: 15, carbG: 50 },
    ),
    null,
  );
});

test('fitScore soft when overshoot — not banned', () => {
  const score = computeFitScore(
    { energyKcal: 600, proteinG: 40, fatG: 20, carbG: 50 },
    { energyKcal: 480, proteinG: 35, fatG: 15, carbG: 50 },
  );
  assert.ok(score !== null && score > 0 && score < 1);
});

test('scoreEatNow ranks and filters no_cook', () => {
  const remaining = remainingMacros(
    { energyKcal: 2000, proteinG: 150, fatG: 70, carbG: 200 },
    { energyKcal: 1520, proteinG: 115, fatG: 55, carbG: 150 },
  );
  assert.equal(hasAnyKnownRemaining(remaining), true);

  const ranked = scoreEatNow(
    [
      {
        id: 'r1',
        kind: 'recipe',
        title: 'Курица с рисом',
        per100: { kcal: 140, protein: 15, fat: 4, carbs: 12 },
        prepMinutes: 25,
        atHome: true,
      },
      {
        id: 'p1',
        kind: 'product',
        title: 'Творог 5%',
        per100: { kcal: 121, protein: 17, fat: 5, carbs: 3 },
        prepMinutes: 2,
        atHome: true,
      },
      {
        id: 'x',
        kind: 'product',
        title: 'Без КБЖУ',
        per100: { kcal: null, protein: null, fat: null, carbs: null },
        prepMinutes: 1,
        atHome: true,
      },
    ],
    remaining,
    ['no_cook'],
  );

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 'p1');
  assert.ok(ranked[0].suggestedGrams >= 40);
  assert.ok(ranked[0].energyKcal !== null);
  assert.ok(ranked[0].fitScore !== null);
});

test('more_protein prefers higher protein density portion', () => {
  const remaining = {
    energyKcal: 500,
    proteinG: 40,
    fatG: 20,
    carbG: 50,
    incomplete: false,
  };
  const ranked = scoreEatNow(
    [
      {
        id: 'low',
        kind: 'product',
        title: 'Банан',
        per100: { kcal: 89, protein: 1, fat: 0.3, carbs: 23 },
        prepMinutes: 1,
        atHome: true,
      },
      {
        id: 'high',
        kind: 'product',
        title: 'Творог',
        per100: { kcal: 121, protein: 17, fat: 5, carbs: 3 },
        prepMinutes: 1,
        atHome: true,
      },
    ],
    remaining,
    ['more_protein'],
  );
  assert.equal(ranked[0].id, 'high');
});
