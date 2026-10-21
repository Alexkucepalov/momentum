import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { parsePurchasePaste, parsePurchaseLine } = mods['domain/parsePurchasePaste'];
const {
  purchaseFingerprint,
  isConfirmablePurchaseStatus,
  resolveExpenseAmountRub,
  linesForPantryApply,
} = mods['domain/purchaseConfirm'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('parsePurchasePaste extracts store, lines, nullable fields', () => {
  const parsed = parsePurchasePaste(`Магазин: Самокат
Молоко 1 л — 89
Хлеб 1 шт 45
Пакет 5
Итого: 139`);
  assert.equal(parsed.storeLabel, 'Самокат');
  assert.equal(parsed.totalRub, 139);
  assert.equal(parsed.lines.length, 3);
  const milk = parsed.lines[0];
  assert.equal(milk.displayName, 'Молоко');
  assert.equal(milk.quantity, 1000);
  assert.equal(milk.unit, 'ml');
  assert.equal(milk.lineTotalRub, 89);
  assert.equal(milk.isFood, true);
  const bag = parsed.lines.find((l) => /пакет/i.test(l.displayName));
  assert.ok(bag);
  assert.equal(bag.isFood, false);
  assert.equal(bag.excluded, true);
});

test('parsePurchaseLine leaves unknown qty/price as null', () => {
  const line = parsePurchaseLine('Творог деревенский');
  assert.equal(line.displayName, 'Творог деревенский');
  assert.equal(line.quantity, null);
  assert.equal(line.lineTotalRub, null);
});

test('confirmable statuses only delivered / fiscal_receipt', () => {
  assert.equal(isConfirmablePurchaseStatus('cart'), false);
  assert.equal(isConfirmablePurchaseStatus('paid'), false);
  assert.equal(isConfirmablePurchaseStatus('delivered'), true);
  assert.equal(isConfirmablePurchaseStatus('fiscal_receipt'), true);
});

test('resolveExpenseAmountRub prefers total; partial line prices → null expense', () => {
  assert.equal(resolveExpenseAmountRub({ totalRub: 100, lines: [] }), 100);
  assert.equal(
    resolveExpenseAmountRub({
      totalRub: null,
      lines: [
        { lineTotalRub: 40, excluded: false },
        { lineTotalRub: null, excluded: false },
      ],
    }),
    null,
  );
  assert.equal(
    resolveExpenseAmountRub({
      totalRub: null,
      lines: [
        { lineTotalRub: 40, excluded: false },
        { lineTotalRub: 10, excluded: false },
      ],
    }),
    50,
  );
  assert.equal(
    resolveExpenseAmountRub({
      totalRub: null,
      lines: [{ lineTotalRub: null, excluded: false }],
    }),
    null,
  );
});

test('linesForPantryApply skips excluded and non-food', () => {
  const out = linesForPantryApply([
    { displayName: 'A', quantity: 1, unit: 'pcs', isFood: true, excluded: false },
    { displayName: 'B', quantity: 1, unit: 'pcs', isFood: true, excluded: true },
    { displayName: 'C', quantity: 1, unit: 'pcs', isFood: false, excluded: false },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].displayName, 'A');
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

test('confirmNewPurchase writes pantry + expense; duplicate blocked', () => {
  const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
  const input = {
    status: 'delivered',
    sourceKind: 'paste',
    purchasedOn: '2026-10-20',
    storeLabel: 'Самокат',
    totalRub: 139,
    lines: [
      {
        rawName: 'Молоко 1 л — 89',
        displayName: 'Молоко',
        quantity: 1000,
        unit: 'ml',
        lineTotalRub: 89,
        isFood: true,
        excluded: false,
      },
      {
        rawName: 'Хлеб 1 шт 45',
        displayName: 'Хлеб',
        quantity: 1,
        unit: 'pcs',
        lineTotalRub: 45,
        isFood: true,
        excluded: false,
      },
      {
        rawName: 'Пакет 5',
        displayName: 'Пакет',
        quantity: 1,
        unit: 'pcs',
        lineTotalRub: 5,
        isFood: false,
        excluded: true,
      },
    ],
  };

  const first = repo.confirmNewPurchase(input);
  assert.equal(first.purchase.status, 'delivered');
  assert.ok(first.purchase.confirmedAt);
  assert.equal(first.pantryItems.length, 2);
  assert.equal(first.pantryItems.every((p) => p.source === 'purchase'), true);
  assert.ok(first.expense);
  assert.equal(first.expense.amountRub, 139);
  assert.equal(repo.listPantryItems().length, 2);
  assert.equal(repo.listFoodExpenses('2026-10').length, 1);

  // Catalog upsert: food lines linked to products; bag skipped.
  const foodLines = first.lines.filter((l) => l.isFood && !l.excluded);
  assert.equal(foodLines.length, 2);
  assert.ok(foodLines.every((l) => l.productId != null));
  assert.ok(first.pantryItems.every((p) => p.productId != null));
  assert.equal(foodLines[0].productId, first.pantryItems[0].productId);

  assert.throws(() => repo.confirmNewPurchase(input), /дубликат/i);
  assert.equal(repo.listPantryItems().length, 2);
});

test('confirmNewPurchase rematches catalog on later purchase; prices observed', () => {
  const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
  const a = repo.confirmNewPurchase({
    status: 'delivered',
    sourceKind: 'paste',
    purchasedOn: '2026-10-20',
    storeLabel: 'Самокат',
    totalRub: 89,
    lines: [
      {
        rawName: 'Греческий йогурт 300г',
        displayName: 'Греческий йогурт',
        quantity: 300,
        unit: 'g',
        lineTotalRub: 89,
        isFood: true,
        excluded: false,
      },
    ],
  });
  const productId = a.lines[0].productId;
  assert.ok(productId);
  const product = repo.listProducts().find((p) => p.id === productId);
  assert.ok(product);
  assert.equal(product.name, 'Греческий йогурт');
  assert.equal(product.energyKcal, null);

  const b = repo.confirmNewPurchase({
    status: 'delivered',
    sourceKind: 'paste',
    purchasedOn: '2026-10-21',
    storeLabel: 'Самокат',
    totalRub: 95,
    lines: [
      {
        rawName: 'Греческий йогурт 300г',
        displayName: 'Греческий йогурт',
        quantity: 300,
        unit: 'g',
        lineTotalRub: 95,
        isFood: true,
        excluded: false,
      },
    ],
  });
  assert.equal(b.lines[0].productId, productId);
  assert.equal(b.lines[0].matchConfidence, 1);
  assert.equal(repo.listProducts().filter((p) => p.name === 'Греческий йогурт').length, 1);

  const prices = repo.toSnapshot().productPrices.filter((p) => !p.deletedAt);
  assert.ok(prices.some((p) => p.observedOn === '2026-10-21' && Math.abs(p.priceRub - 95 / 300) < 1e-9));
});

test('null prices stay null; no expense when totals unknown', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const result = repo.confirmNewPurchase({
    status: 'fiscal_receipt',
    sourceKind: 'manual',
    purchasedOn: '2026-10-21',
    totalRub: null,
    lines: [
      {
        rawName: 'Сыр',
        displayName: 'Сыр',
        quantity: 200,
        unit: 'g',
        lineTotalRub: null,
        isFood: true,
        excluded: false,
      },
    ],
  });
  assert.equal(result.expense, null);
  assert.equal(result.purchase.totalRub, null);
  assert.equal(result.lines[0].lineTotalRub, null);
  assert.equal(result.pantryItems[0].quantityG, 200);
});

test('fingerprint stable for same payload', () => {
  const a = purchaseFingerprint({
    storeLabel: 'X',
    purchasedOn: '2026-10-20',
    totalRub: 10,
    lines: [{ displayName: 'Молоко', quantity: 1, unit: 'pcs', lineTotalRub: 10, excluded: false }],
  });
  const b = purchaseFingerprint({
    storeLabel: 'X',
    purchasedOn: '2026-10-20',
    totalRub: 10,
    lines: [{ displayName: 'молоко', quantity: 1, unit: 'pcs', lineTotalRub: 10, excluded: false }],
  });
  assert.equal(a, b);
});
