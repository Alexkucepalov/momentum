import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { unifiedFoodSearch } = mods['domain/unifiedFoodSearch'];

test('unified search ranks recent and mixes products + recipes', () => {
  const hits = unifiedFoodSearch({
    query: 'овс',
    products: [
      {
        id: 'p1',
        name: 'Овёс цельный',
        brand: null,
        barcode: null,
        energyKcal: 100,
        proteinG: 10,
        fatG: 2,
        carbG: 20,
        source: 'user',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    recipes: [
      {
        id: 'r1',
        name: 'Каша из овса',
        cookedYieldG: 400,
        description: null,
        photoUri: null,
        energyKcalPer100g: null,
        proteinGPer100g: null,
        fatGPer100g: null,
        carbGPer100g: null,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    recent: [
      {
        id: 'e1',
        dateLocal: '2026-10-17',
        meal: 'breakfast',
        displayName: 'Овсянка',
        grams: 200,
        productId: 'p1',
        recipeId: null,
        energyKcal: 200,
        proteinG: 20,
        fatG: 4,
        carbG: 40,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
  });
  assert.ok(hits.length >= 2);
  assert.equal(hits[0].kind, 'recent');
  assert.ok(hits.some((h) => h.kind === 'recipe'));
});

test('empty query returns no hits', () => {
  assert.deepEqual(
    unifiedFoodSearch({ query: '  ', products: [], recipes: [], recent: [] }),
    [],
  );
});
