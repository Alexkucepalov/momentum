import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { isEatNowNoiseProduct, selectEatNowProducts, recipeHasBatch } =
  loadSrcModules()['domain/eatNowPool'];

function product(overrides) {
  return {
    id: 'p',
    name: 'Продукт',
    brand: null,
    barcode: null,
    energyKcal: 100,
    proteinG: 5,
    fatG: 2,
    carbG: 10,
    source: 'catalog',
    isFavorite: false,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    ...overrides,
  };
}

test('noise products excluded', () => {
  assert.equal(
    isEatNowNoiseProduct(product({ id: 'seed:water', name: 'Вода', energyKcal: 0, proteinG: 0 })),
    true,
  );
});

test('selectEatNowProducts keeps favorites and skips oil', () => {
  const pool = selectEatNowProducts({
    products: [
      product({ id: 'seed:oil-olive', name: 'Масло оливковое', energyKcal: 884, fatG: 100 }),
      product({ id: 'seed:cottage-5', name: 'Творог 5%', isFavorite: true }),
    ],
    frequentIds: new Set(),
  });
  assert.equal(pool.some((p) => p.id === 'seed:oil-olive'), false);
  assert.equal(pool.some((p) => p.id === 'seed:cottage-5'), true);
});

test('selectEatNowProducts skips plain seed catalog but keeps user and frequent', () => {
  const pool = selectEatNowProducts({
    products: [
      product({ id: 'seed:rice', name: 'Рис' }),
      product({ id: 'seed:buckwheat', name: 'Гречка' }),
      product({ id: 'u1', name: 'Мой йогурт', source: 'user' }),
      product({ id: 'gone', name: 'Удалён', source: 'user', deletedAt: '2026-10-01' }),
    ],
    frequentIds: new Set(['seed:buckwheat']),
  });
  assert.deepEqual(
    pool.map((p) => p.id).sort(),
    ['seed:buckwheat', 'u1'],
  );
});

test('recipeHasBatch', () => {
  assert.equal(recipeHasBatch('r1', new Set(['r1'])), true);
  assert.equal(recipeHasBatch('r2', new Set(['r1'])), false);
});
