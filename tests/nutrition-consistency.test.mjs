import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(
  new URL('../src/domain/nutritionConsistency.ts', import.meta.url),
  'utf8',
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', transpiled)(mod, mod.exports);
const {
  estimatedKcalFromMacros,
  nutritionConsistencyHint,
  kcalFromCompleteMacros,
  autoKcalStringFromMacroStrings,
} = mod.exports;

test('estimatedKcalFromMacros uses 4/9/4 without inventing', () => {
  assert.equal(estimatedKcalFromMacros(40, 13, 23), 40 * 4 + 13 * 9 + 23 * 4);
});

test('hint null when any field unknown', () => {
  assert.equal(
    nutritionConsistencyHint({
      energyKcal: 750,
      proteinG: 40,
      fatG: 13,
      carbG: null,
    }),
    null,
  );
});

test('hint null when label matches macros within 15%', () => {
  const p = 10;
  const f = 5;
  const c = 25;
  const kcal = estimatedKcalFromMacros(p, f, c);
  assert.equal(
    nutritionConsistencyHint({
      energyKcal: kcal,
      proteinG: p,
      fatG: f,
      carbG: c,
    }),
    null,
  );
});

test('hint when label kcal far from macros (no auto-fix)', () => {
  const hint = nutritionConsistencyHint({
    energyKcal: 750,
    proteinG: 40,
    fatG: 13,
    carbG: 23,
  });
  assert.ok(hint);
  assert.match(hint, /расходятся/);
});

test('hint does not mutate inputs', () => {
  const fields = { energyKcal: 750, proteinG: 40, fatG: 13, carbG: 23 };
  nutritionConsistencyHint(fields);
  assert.deepEqual(fields, { energyKcal: 750, proteinG: 40, fatG: 13, carbG: 23 });
});

test('kcalFromCompleteMacros needs all three macros', () => {
  assert.equal(kcalFromCompleteMacros(10, 5, null), null);
  assert.equal(kcalFromCompleteMacros(10, 5, 25), Math.round(10 * 4 + 5 * 9 + 25 * 4));
});

test('autoKcalStringFromMacroStrings rounds Atwater', () => {
  assert.equal(autoKcalStringFromMacroStrings('10', '5', '25'), '185');
  assert.equal(autoKcalStringFromMacroStrings('10', '', '25'), null);
});
