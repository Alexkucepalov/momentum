import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { isEatNowNoiseProduct, pantryAtHomeProductIds, selectEatNowProducts } =
  loadSrcModules()['domain/eatNowPool'];

test('noise products excluded', () => {
  assert.equal(
    isEatNowNoiseProduct({
      id: 'seed:water',
      name: 'Вода',
      brand: null,
      barcode: null,
      energyKcal: 0,
      proteinG: 0,
      fatG: 0,
      carbG: 0,
      source: 'catalog',
      isFavorite: false,
      createdAt: '',
      updatedAt: '',
      deletedAt: null,
    }),
    true,
  );
});

test('pantry matches by name without productId', () => {
  const ids = pantryAtHomeProductIds(
    [
      {
        id: 'p1',
        displayName: 'Творог 5%',
        productId: null,
        location: 'fridge',
        quantityG: 400,
        quantityCount: null,
        unit: 'g',
        expiresOn: null,
        source: 'user',
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    [
      {
        id: 'seed:cottage-5',
        name: 'Творог 5%',
        brand: null,
        barcode: null,
        energyKcal: 121,
        proteinG: 17,
        fatG: 5,
        carbG: 2,
        source: 'catalog',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
  );
  assert.ok(ids.has('seed:cottage-5'));
});

test('selectEatNowProducts keeps favorites and skips oil', () => {
  const { usefulProducts } = selectEatNowProducts({
    recipes: [],
    products: [
      {
        id: 'seed:oil-olive',
        name: 'Масло оливковое',
        brand: null,
        barcode: null,
        energyKcal: 884,
        proteinG: 0,
        fatG: 100,
        carbG: 0,
        source: 'catalog',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
      {
        id: 'seed:cottage-5',
        name: 'Творог 5%',
        brand: null,
        barcode: null,
        energyKcal: 121,
        proteinG: 17,
        fatG: 5,
        carbG: 2,
        source: 'catalog',
        isFavorite: true,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    pantry: [],
    frequentIds: new Set(),
    batchRecipeIds: new Set(),
  });
  assert.equal(usefulProducts.some((p) => p.id === 'seed:oil-olive'), false);
  assert.equal(usefulProducts.some((p) => p.id === 'seed:cottage-5'), true);
});
