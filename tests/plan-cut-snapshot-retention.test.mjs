import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

// ADR-009: retired surfaces keep their snapshot data (export/restore unchanged).
const RETIRED_KEYS = [
  'pantryItems',
  'shoppingLists',
  'shoppingItems',
  'productPrices',
  'foodBudgets',
  'foodExpenses',
  'storePreferences',
  'purchases',
  'purchaseLines',
];

const TS = '2026-10-01T09:00:00.000Z';

function retiredFixture() {
  return {
    pantryItems: [
      {
        id: 'pantry-1',
        displayName: 'Тестовый продукт А',
        productId: null,
        location: 'fridge',
        quantityG: 400,
        quantityCount: null,
        unit: 'g',
        expiresOn: '2026-10-10',
        source: 'purchase',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
      {
        id: 'pantry-2',
        displayName: 'Тестовый продукт Б',
        productId: null,
        location: 'pantry',
        quantityG: null,
        quantityCount: null,
        unit: 'pcs',
        expiresOn: null,
        source: 'user',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: TS,
      },
    ],
    shoppingLists: [
      {
        id: 'list-1',
        planId: null,
        title: 'Тестовый список',
        status: 'open',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    shoppingItems: [
      {
        id: 'item-1',
        listId: 'list-1',
        displayName: 'Тестовый продукт А',
        quantity: 500,
        unit: 'g',
        coveredByPantry: 400,
        needToBuy: 100,
        checked: false,
        priceRub: 50,
        priceAsOf: '2026-10-01',
        priceSource: 'user',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
      {
        id: 'item-2',
        listId: 'list-1',
        displayName: 'Тестовый продукт В',
        quantity: 2,
        unit: 'pcs',
        coveredByPantry: 0,
        needToBuy: 2,
        checked: true,
        priceRub: null,
        priceAsOf: null,
        priceSource: null,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    productPrices: [
      {
        id: 'price-1',
        productKey: 'тестовый продукт а|g',
        storeId: 'store:other',
        priceRub: 500,
        unit: 'g',
        observedOn: '2026-10-01',
        source: 'receipt',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    foodBudgets: [
      {
        id: 'budget-1',
        month: '2026-10',
        limitRub: 30000,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    foodExpenses: [
      {
        id: 'expense-1',
        amountRub: 1200,
        category: 'groceries',
        spentOn: '2026-10-01',
        note: 'Тестовая покупка',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
      {
        id: 'expense-2',
        amountRub: 450,
        category: 'cafe',
        spentOn: '2026-10-02',
        note: null,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    storePreferences: [
      {
        id: 'store:other',
        storeId: 'other',
        label: 'Другие',
        selected: true,
        updatedAt: TS,
      },
    ],
    purchases: [
      {
        id: 'purchase-1',
        status: 'fiscal_receipt',
        storePreferenceId: 'store:other',
        storeLabel: 'Тестовый магазин',
        purchasedOn: '2026-10-01',
        currency: 'RUB',
        totalRub: 1200,
        sourceKind: 'paste',
        fingerprint: 'fp-synthetic-1',
        rawPayloadRef: null,
        parseConfidence: 0.9,
        confirmedAt: TS,
        expenseId: 'expense-1',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
    purchaseLines: [
      {
        id: 'line-1',
        purchaseId: 'purchase-1',
        rawName: 'ТЕСТ ПРОДУКТ А 400Г',
        displayName: 'Тестовый продукт А',
        quantity: 400,
        unit: 'g',
        packageSizeText: '400 г',
        unitPriceRub: null,
        lineTotalRub: 200,
        discountRub: null,
        isFood: true,
        excluded: false,
        productId: null,
        barcode: null,
        retailerSku: null,
        matchConfidence: null,
        pantryItemId: 'pantry-1',
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
      {
        id: 'line-2',
        purchaseId: 'purchase-1',
        rawName: 'ПАКЕТ',
        displayName: 'Пакет',
        quantity: null,
        unit: null,
        packageSizeText: null,
        unitPriceRub: null,
        lineTotalRub: 5,
        discountRub: null,
        isFood: false,
        excluded: true,
        productId: null,
        barcode: null,
        retailerSku: null,
        matchConfidence: null,
        pantryItemId: null,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      },
    ],
  };
}

function v14Snapshot() {
  return {
    version: 14,
    profile: { id: 'p', timezone: 'UTC', locale: 'ru', units: 'metric' },
    products: [],
    recipes: [],
    ingredients: [],
    entries: [],
    ...retiredFixture(),
  };
}

function assertRetiredPreserved(snap) {
  const expected = retiredFixture();
  for (const key of RETIRED_KEYS) {
    assert.ok(expected[key].length > 0, `fixture ${key} must be non-empty`);
    assert.deepEqual(snap[key], expected[key], `${key} preserved`);
  }
}

test('v14 snapshot keeps retired plan data through toSnapshot', () => {
  const repo = createMemoryFoodRepository({ snapshot: v14Snapshot() });
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 14);
  assertRetiredPreserved(snap);
});

test('export → import round-trip keeps retired plan data', () => {
  const source = createMemoryFoodRepository({ snapshot: v14Snapshot() });
  const target = createMemoryFoodRepository({ timezone: 'UTC' });
  target.importAll(source.exportAll());
  const snap = target.toSnapshot();
  assert.equal(snap.version, 14);
  assertRetiredPreserved(snap);
});

test('kept-feature mutation does not drop retired plan data', () => {
  const repo = createMemoryFoodRepository({ snapshot: v14Snapshot() });
  let persisted = null;
  repo.setPersistHook((s) => {
    persisted = s;
  });
  repo.addQuickEntry({
    dateLocal: '2026-10-20',
    meal: 'snack',
    displayName: 'Тестовый перекус',
    energyKcal: null,
  });
  assert.ok(persisted);
  assertRetiredPreserved(persisted);
});

test('snapshot migrates v13 → v14 with empty purchases', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 13,
      profile: { id: 'p', timezone: 'UTC', locale: 'ru', units: 'metric' },
      products: [],
      recipes: [],
      ingredients: [],
      entries: [],
    },
  });
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 14);
  assert.deepEqual(snap.purchases, []);
  assert.deepEqual(snap.purchaseLines, []);
});

test('retired pantry/shopping/budget/purchase API is not exposed', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  for (const method of [
    'listPantryItems',
    'confirmNewPurchase',
    'createShoppingListFromPlan',
    'upsertProductPrice',
    'setFoodBudget',
    'addFoodExpense',
    'monthBudgetSnapshot',
    'monthEatenCostEstimate',
    'listStorePreferences',
  ]) {
    assert.equal(repo[method], undefined, method);
  }
});
