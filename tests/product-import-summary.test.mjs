import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const {
  formatProductImportSummary,
  productHasAnyKnownMacro,
} = loadSrcModules()['domain/productImportSummary'];

test('productHasAnyKnownMacro treats all-null as unknown', () => {
  assert.equal(
    productHasAnyKnownMacro({
      energyKcal: null,
      proteinG: null,
      fatG: null,
      carbG: null,
    }),
    false,
  );
  assert.equal(
    productHasAnyKnownMacro({
      energyKcal: 100,
      proteinG: null,
      fatG: null,
      carbG: null,
    }),
    true,
  );
});

test('formatProductImportSummary matches audit copy shape', () => {
  assert.equal(
    formatProductImportSummary({
      created: 8,
      withMacros: 3,
      needFill: 5,
      skippedDuplicates: 2,
    }),
    'Добавлено 8 · КБЖУ есть у 3 · требуют уточнения 5 · дублей пропущено 2',
  );
  assert.equal(
    formatProductImportSummary({
      created: 0,
      withMacros: 0,
      needFill: 0,
      skippedDuplicates: 4,
    }),
    'Добавлено 0 · дублей пропущено 4',
  );
});
