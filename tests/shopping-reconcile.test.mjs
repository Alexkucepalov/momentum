import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { reconcileShoppingWithPurchaseLines } = loadSrcModules()['domain/shoppingReconcile'];
const { createMemoryFoodRepository } = loadSrcModules()['storage/foodRepository'];

test('reconcile reduces need and checks off full match', () => {
  const patches = reconcileShoppingWithPurchaseLines(
    [
      { id: 'a', displayName: 'Молоко', unit: 'ml', needToBuy: 1000, checked: false },
      { id: 'b', displayName: 'Хлеб', unit: 'pcs', needToBuy: 1, checked: false },
    ],
    [
      { displayName: 'Молоко', quantity: 930, unit: 'ml', excluded: false, isFood: true },
      { displayName: 'Хлеб', quantity: 1, unit: 'pcs', excluded: false, isFood: true },
    ],
  );
  assert.equal(patches.length, 2);
  const milk = patches.find((p) => p.itemId === 'a');
  const bread = patches.find((p) => p.itemId === 'b');
  assert.equal(milk.needToBuy, 70);
  assert.equal(milk.checked, false);
  assert.equal(bread.needToBuy, 0);
  assert.equal(bread.checked, true);
});

test('unknown purchase qty does not auto-cover', () => {
  const patches = reconcileShoppingWithPurchaseLines(
    [{ id: 'a', displayName: 'Рис', unit: 'g', needToBuy: 500, checked: false }],
    [{ displayName: 'Рис', quantity: null, unit: 'g', excluded: false, isFood: true }],
  );
  assert.equal(patches.length, 0);
});

test('createShoppingListFromRecipe keeps only pantry gaps', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 300,
    ingredients: [
      {
        displayName: 'Овсянка',
        rawGrams: 80,
        nutritionPer100g: { kcal: 350, protein: 12, fat: 6, carbs: 60 },
      },
      {
        displayName: 'Молоко',
        rawGrams: 200,
        nutritionPer100g: { kcal: 52, protein: 3, fat: 2.5, carbs: 5 },
      },
    ],
  });
  repo.upsertPantryItem({
    displayName: 'Овсянка',
    location: 'pantry',
    quantityG: 100,
    unit: 'g',
  });
  const list = repo.createShoppingListFromRecipe(recipe.id);
  const items = repo.listShoppingItems(list.id);
  assert.equal(items.length, 1);
  assert.equal(items[0].displayName, 'Молоко');
  assert.equal(items[0].needToBuy, 200);
});

test('repo: empty list + manual item + purchase reconcile', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const list = repo.createEmptyShoppingList('Тест');
  repo.addShoppingItem({ listId: list.id, displayName: 'Молоко', quantity: 1000, unit: 'ml' });
  const purchase = repo.confirmNewPurchase({
    status: 'delivered',
    sourceKind: 'manual',
    purchasedOn: '2026-10-21',
    storeLabel: 'Тест',
    totalRub: 90,
    lines: [
      {
        rawName: 'Молоко',
        displayName: 'Молоко',
        quantity: 1000,
        unit: 'ml',
        lineTotalRub: 90,
        isFood: true,
        excluded: false,
      },
    ],
  });
  assert.ok(purchase.purchase.id);
  const items = repo.listShoppingItems(list.id);
  assert.equal(items[0].needToBuy, 0);
  assert.equal(items[0].checked, true);
});
