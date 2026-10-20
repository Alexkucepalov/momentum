import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('Purchase workflow', () => {
  it('creates purchase from text', () => {
    const repo = createMemoryFoodRepository();
    
    const text = `Пятерочка
Молоко 1л 89₽
Хлеб 500г 45₽
ИТОГО: 134₽`;
    
    const { purchase, lines } = repo.createPurchaseFromText({ text });
    
    assert.equal(purchase.status, 'cart');
    assert.equal(purchase.confirmedAt, null);
    assert.equal(purchase.storeLabel, 'Пятерочка');
    assert.equal(purchase.totalRub, 134);
    assert.equal(purchase.sourceKind, 'paste');
    assert.ok(purchase.fingerprint);
    
    assert.equal(lines.length, 2);
    assert.equal(lines[0].displayName, 'Молоко');
    assert.equal(lines[0].quantity, 1000);
    assert.equal(lines[0].unit, 'ml');
    assert.equal(lines[0].lineTotalRub, 89);
    assert.equal(lines[0].isFood, true);
    assert.equal(lines[0].excluded, false);
  });

  it('rejects duplicate fingerprint', () => {
    const repo = createMemoryFoodRepository();
    
    const text = `Молоко 1л 89₽
ИТОГО: 89₽`;
    
    repo.createPurchaseFromText({ text });
    
    assert.throws(
      () => repo.createPurchaseFromText({ text }),
      /fingerprint already exists/,
    );
  });

  it('retrieves purchase by id', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    const retrieved = repo.getPurchase(purchase.id);
    
    assert.ok(retrieved);
    assert.equal(retrieved.purchase.id, purchase.id);
    assert.equal(retrieved.lines.length, 1);
  });

  it('returns null for non-existent purchase', () => {
    const repo = createMemoryFoodRepository();
    const retrieved = repo.getPurchase('non-existent');
    assert.equal(retrieved, null);
  });

  it('lists purchases', () => {
    const repo = createMemoryFoodRepository();
    
    repo.createPurchaseFromText({ text: 'Молоко 1л 89₽\nИТОГО: 89₽' });
    repo.createPurchaseFromText({ text: 'Хлеб 45₽\nИТОГО: 45₽' });
    
    const purchases = repo.listPurchases();
    assert.equal(purchases.length, 2);
  });

  it('updates purchase line', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    const updated = repo.updatePurchaseLine(lines[0].id, {
      displayName: 'Молоко 3.2%',
      quantity: 950,
      lineTotalRub: 85,
    });
    
    assert.equal(updated.displayName, 'Молоко 3.2%');
    assert.equal(updated.quantity, 950);
    assert.equal(updated.lineTotalRub, 85);
  });

  it('excludes non-food line', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    const updated = repo.updatePurchaseLine(lines[0].id, {
      excluded: true,
    });
    
    assert.equal(updated.excluded, true);
  });

  it('rejects negative quantity', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    assert.throws(
      () => repo.updatePurchaseLine(lines[0].id, { quantity: -100 }),
      /non-negative/,
    );
  });

  it('rejects negative price', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    assert.throws(
      () => repo.updatePurchaseLine(lines[0].id, { lineTotalRub: -50 }),
      /non-negative/,
    );
  });

  it('confirms purchase and creates pantry items', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: `Молоко 1л 89₽
Хлеб 500г 45₽
ИТОГО: 134₽`,
    });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'delivered',
    });
    
    assert.equal(result.purchase.status, 'delivered');
    assert.ok(result.purchase.confirmedAt);
    assert.equal(result.pantryItems.length, 2);
    
    assert.equal(result.pantryItems[0].displayName, 'Молоко');
    assert.equal(result.pantryItems[0].quantityG, 1000);
    assert.equal(result.pantryItems[0].unit, 'ml');
    assert.equal(result.pantryItems[0].source, 'purchase');
    
    assert.equal(result.pantryItems[1].displayName, 'Хлеб');
    assert.equal(result.pantryItems[1].quantityG, 500);
    assert.equal(result.pantryItems[1].unit, 'g');
  });

  it('confirms purchase and creates expense', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: `Молоко 1л 89₽
ИТОГО: 89₽`,
    });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'fiscal_receipt',
    });
    
    assert.ok(result.expense);
    assert.equal(result.expense.amountRub, 89);
    assert.equal(result.expense.category, 'groceries');
    assert.equal(result.expense.spentOn, purchase.purchasedOn);
  });

  it('skips excluded lines when confirming', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase, lines } = repo.createPurchaseFromText({
      text: `Молоко 1л 89₽
Мыло 50₽`,
    });
    
    repo.updatePurchaseLine(lines[1].id, { excluded: true });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'delivered',
    });
    
    assert.equal(result.pantryItems.length, 1);
    assert.equal(result.pantryItems[0].displayName, 'Молоко');
  });

  it('skips non-food lines when confirming', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: `Молоко 1л 89₽
Губка для посуды 50₽`,
    });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'delivered',
    });
    
    assert.equal(result.pantryItems.length, 1);
    assert.equal(result.pantryItems[0].displayName, 'Молоко');
  });

  it('handles lines without quantity when confirming', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: `Хлеб 45₽`,
    });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'delivered',
    });
    
    assert.equal(result.pantryItems.length, 0);
  });

  it('rejects confirming already confirmed purchase', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    repo.confirmPurchase(purchase.id, { status: 'delivered' });
    
    assert.throws(
      () => repo.confirmPurchase(purchase.id, { status: 'delivered' }),
      /already confirmed/,
    );
  });

  it('creates product prices from confirmed lines', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: `Молоко 1л 89₽
20.10.2026`,
      purchasedOn: '2026-10-20',
    });
    
    repo.confirmPurchase(purchase.id, { status: 'delivered' });
    
    const prices = [...repo.toSnapshot().productPrices];
    assert.ok(prices.length > 0);
    
    const milkPrice = prices.find(p => p.productKey.toLowerCase().includes('молоко'));
    assert.ok(milkPrice);
    assert.equal(milkPrice.priceRub, 89);
    assert.equal(milkPrice.source, 'receipt');
  });

  it('handles null total when confirming', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    const result = repo.confirmPurchase(purchase.id, {
      status: 'delivered',
    });
    
    assert.equal(result.expense, null);
  });

  it('preserves unknown quantities as null', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Хлеб 45₽',
    });
    
    assert.equal(lines[0].quantity, null);
    assert.equal(lines[0].unit, null);
  });

  it('preserves unknown prices as null', () => {
    const repo = createMemoryFoodRepository();
    
    const { lines } = repo.createPurchaseFromText({
      text: 'Молоко 1л',
    });
    
    assert.equal(lines[0].lineTotalRub, null);
    assert.equal(lines[0].unitPriceRub, null);
  });

  it('persists purchases in snapshot', () => {
    const repo = createMemoryFoodRepository();
    
    const { purchase } = repo.createPurchaseFromText({
      text: 'Молоко 1л 89₽',
    });
    
    const snapshot = repo.toSnapshot();
    
    assert.equal(snapshot.version, 14);
    assert.equal(snapshot.purchases.length, 1);
    assert.equal(snapshot.purchases[0].id, purchase.id);
    assert.equal(snapshot.purchaseLines.length, 1);
  });
});
