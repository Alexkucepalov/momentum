import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { matchPurchaseProduct, normalizePurchaseProductName } = mods['domain/matchPurchaseProduct'];

const base = {
  brand: null,
  barcode: null,
  energyKcal: null,
  proteinG: null,
  fatG: null,
  carbG: null,
  source: 'user',
  isFavorite: false,
  createdAt: 't',
  updatedAt: 't',
  deletedAt: null,
};

test('normalizePurchaseProductName folds ё and punctuation', () => {
  assert.equal(normalizePurchaseProductName('Творог, 5%'), 'творог 5%');
  assert.equal(normalizePurchaseProductName('Ёлка'), 'елка');
});

test('matchPurchaseProduct: barcode > exact > starts; ambiguous → none', () => {
  const products = [
    { ...base, id: 'a', name: 'Молоко 2.5%', barcode: '4601234567890' },
    { ...base, id: 'b', name: 'Хлеб белый', barcode: null },
    { ...base, id: 'c', name: 'Хлеб чёрный', barcode: null },
  ];

  assert.equal(
    matchPurchaseProduct({ displayName: 'x', barcode: '4601234567890' }, products).productId,
    'a',
  );
  assert.equal(
    matchPurchaseProduct({ displayName: 'Молоко 2.5%' }, products).kind,
    'exact',
  );
  assert.equal(
    matchPurchaseProduct({ displayName: 'Молоко' }, products).kind,
    'starts',
  );
  assert.equal(
    matchPurchaseProduct({ displayName: 'Хлеб' }, products).kind,
    'none',
  );
});
