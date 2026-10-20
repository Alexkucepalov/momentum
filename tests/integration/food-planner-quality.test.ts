/**
 * Integration Quality Tests for Food Planner (FI slices 1-4)
 * Issue #67: FI Quality Sprint
 *
 * Validates:
 * - planned ≠ eaten (planned meals don't affect daily totals)
 * - unknown ≠ 0 (null prices/nutrition preserved)
 * - re-import dedupe
 * - pantry/expense no double-write
 * - retailer receipt processing (synthetic fixtures)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createFoodRepository } from '../../src/storage/foodRepository';
import type { StoreSnapshot } from '../../src/storage/types';

describe('Food Planner Quality Sprint', () => {
  let repo: ReturnType<typeof createFoodRepository>;
  let initialSnapshot: StoreSnapshot;

  beforeEach(() => {
    repo = createFoodRepository();
    initialSnapshot = repo.toSnapshot();
  });

  describe('planned ≠ eaten', () => {
    it('planned meals do not affect daily totals', () => {
      const dateLocal = '2026-10-20';

      const product = repo.createProduct({
        name: 'Тестовый продукт',
        energyKcal: 100,
        proteinG: 10,
        fatG: 5,
        carbG: 15,
      });

      const totalsBeforePlanned = repo.dailyTotals(dateLocal);
      expect(totalsBeforePlanned.energyKcal).toBe(0);
      expect(totalsBeforePlanned.entryCount).toBe(0);

      repo.addPlannedMeal({
        dateLocal,
        meal: 'breakfast',
        displayName: product.name,
        grams: 100,
        productId: product.id,
      });

      const totalsAfterPlanned = repo.dailyTotals(dateLocal);
      expect(totalsAfterPlanned.energyKcal).toBe(0);
      expect(totalsAfterPlanned.entryCount).toBe(0);

      repo.addEntryFromProduct({
        productId: product.id,
        dateLocal,
        meal: 'breakfast',
        grams: 100,
      });

      const totalsAfterEaten = repo.dailyTotals(dateLocal);
      expect(totalsAfterEaten.energyKcal).toBe(100);
      expect(totalsAfterEaten.entryCount).toBe(1);
    });

    it('logging planned meal marks it as logged but does not double-count', () => {
      const dateLocal = '2026-10-20';

      const product = repo.createProduct({
        name: 'Тестовый продукт 2',
        energyKcal: 200,
        proteinG: 20,
        fatG: 10,
        carbG: 25,
      });

      const plannedMeal = repo.addPlannedMeal({
        dateLocal,
        meal: 'lunch',
        displayName: product.name,
        grams: 150,
        productId: product.id,
      });

      expect(plannedMeal.status).toBe('planned');

      const totalsBeforeLog = repo.dailyTotals(dateLocal);
      expect(totalsBeforeLog.energyKcal).toBe(0);

      const entry = repo.logPlannedMealToDiary(plannedMeal.id);
      expect(entry.grams).toBe(150);
      expect(entry.energyKcal).toBe(300);

      const plannedMeals = repo.listPlannedMealsForDate(dateLocal);
      const logged = plannedMeals.find((m) => m.id === plannedMeal.id);
      expect(logged?.status).toBe('logged');

      const totalsAfterLog = repo.dailyTotals(dateLocal);
      expect(totalsAfterLog.energyKcal).toBe(300);
      expect(totalsAfterLog.entryCount).toBe(1);
    });
  });

  describe('unknown ≠ 0', () => {
    it('preserves null prices in shopping items', () => {
      const dateLocal = '2026-10-20';
      const product = repo.createProduct({
        name: 'Продукт без цены',
        energyKcal: 100,
        proteinG: 10,
      });

      const recipe = repo.createRecipe({
        name: 'Рецепт для плана',
        cookedYieldG: 500,
        ingredients: [
          {
            productId: product.id,
            displayName: product.name,
            rawGrams: 200,
          },
        ],
      });

      const plan = repo.createMealPlanDraft({
        startDateLocal: dateLocal,
        days: 3,
      });

      repo.addPlannedMeal({
        dateLocal,
        meal: 'dinner',
        displayName: recipe.name,
        grams: 250,
        recipeId: recipe.id,
      });

      const shoppingList = repo.createShoppingListFromPlan(plan.id);
      const items = repo.listShoppingItems(shoppingList.id);

      expect(items.length).toBeGreaterThan(0);
      const item = items[0];
      expect(item.priceRub).toBeNull();
      expect(item.priceAsOf).toBeNull();
      expect(item.priceSource).toBeNull();
    });

    it('preserves unknown nutrition fields', () => {
      const product = repo.createProduct({
        name: 'Продукт с частичными макросами',
        energyKcal: 150,
        proteinG: null,
        fatG: 5,
        carbG: null,
      });

      expect(product.energyKcal).toBe(150);
      expect(product.proteinG).toBeNull();
      expect(product.fatG).toBe(5);
      expect(product.carbG).toBeNull();

      const entry = repo.addEntryFromProduct({
        productId: product.id,
        dateLocal: '2026-10-20',
        meal: 'snack',
        grams: 100,
      });

      expect(entry.energyKcal).toBe(150);
      expect(entry.proteinG).toBeNull();
      expect(entry.fatG).toBe(5);
      expect(entry.carbG).toBeNull();

      const totals = repo.dailyTotals('2026-10-20');
      expect(totals.hasUnknownFields).toBe(true);
      expect(totals.energyKcal).toBe(150);
      expect(totals.proteinG).toBeNull();
    });
  });

  describe('re-import dedupe', () => {
    it('does not create duplicate products on re-import', () => {
      const snapshot1 = repo.toSnapshot();
      
      const product = repo.createProduct({
        name: 'Молоко',
        brand: 'Простоквашино',
        barcode: '4607025392010',
        energyKcal: 64,
        proteinG: 3.2,
        fatG: 3.2,
        carbG: 4.7,
      });

      const snapshot2 = repo.toSnapshot();
      expect(snapshot2.products.length).toBe(1);

      repo.importSnapshot(snapshot2);

      const snapshot3 = repo.toSnapshot();
      expect(snapshot3.products.length).toBe(1);
      expect(snapshot3.products[0].id).toBe(product.id);
    });

    it('merges recipes on re-import without duplication', () => {
      const recipe1 = repo.createRecipe({
        name: 'Борщ',
        cookedYieldG: 2000,
        ingredients: [],
      });

      const snapshot = repo.toSnapshot();
      expect(snapshot.recipes.length).toBe(1);

      repo.importSnapshot(snapshot);

      const finalSnapshot = repo.toSnapshot();
      expect(finalSnapshot.recipes.length).toBe(1);
      expect(finalSnapshot.recipes[0].id).toBe(recipe1.id);
    });
  });

  describe('pantry/expense no double-write', () => {
    it('adding to pantry does not create food expense', () => {
      const product = repo.createProduct({
        name: 'Гречка',
        energyKcal: 330,
        proteinG: 12.6,
      });

      const expensesBefore = repo.listFoodExpenses('2026-10');
      const expensesCountBefore = expensesBefore.length;

      repo.upsertPantryItem({
        displayName: product.name,
        productId: product.id,
        location: 'pantry',
        unit: 'g',
        quantityG: 800,
      });

      const expensesAfter = repo.listFoodExpenses('2026-10');
      expect(expensesAfter.length).toBe(expensesCountBefore);
    });

    it('creating shopping list does not create expense', () => {
      const dateLocal = '2026-10-20';
      const product = repo.createProduct({
        name: 'Масло',
        energyKcal: 900,
      });

      const recipe = repo.createRecipe({
        name: 'Салат',
        cookedYieldG: 300,
        ingredients: [
          {
            productId: product.id,
            displayName: product.name,
            rawGrams: 50,
          },
        ],
      });

      const plan = repo.createMealPlanDraft({
        startDateLocal: dateLocal,
        days: 3,
      });

      repo.addPlannedMeal({
        dateLocal,
        meal: 'lunch',
        displayName: recipe.name,
        grams: 150,
        recipeId: recipe.id,
      });

      const expensesBefore = repo.listFoodExpenses('2026-10');
      const countBefore = expensesBefore.length;

      const shoppingList = repo.createShoppingListFromPlan(plan.id);
      expect(shoppingList).toBeDefined();

      const expensesAfter = repo.listFoodExpenses('2026-10');
      expect(expensesAfter.length).toBe(countBefore);
    });
  });

  describe('retailer receipt processing', () => {
    it('handles weight-based items correctly', () => {
      const product = repo.createProduct({
        name: 'Яблоки Голден',
        energyKcal: 47,
        proteinG: 0.4,
        fatG: 0.4,
        carbG: 9.8,
      });

      repo.upsertProductPrice({
        productKey: 'яблоки голден',
        priceRub: 119.90,
        unit: 'g',
        observedOn: '2026-10-15',
        source: 'receipt',
      });

      repo.upsertPantryItem({
        displayName: 'Яблоки Голден',
        productId: product.id,
        location: 'fridge',
        unit: 'g',
        quantityG: 1250,
      });

      const pantryItems = repo.listPantryItems();
      const apples = pantryItems.find((i) => i.displayName === 'Яблоки Голден');
      expect(apples).toBeDefined();
      expect(apples?.quantityG).toBe(1250);
      expect(apples?.unit).toBe('g');
    });

    it('handles discount prices correctly', () => {
      const originalPrice = 45.50;
      const discount = 5.00;
      const finalPrice = originalPrice - discount;

      repo.upsertProductPrice({
        productKey: 'хлеб бородинский',
        priceRub: finalPrice,
        unit: 'g',
        observedOn: '2026-10-15',
        source: 'receipt',
      });

      const prices = repo.listProductPrices();
      const breadPrice = prices.find((p) => p.productKey === 'хлеб бородинский');
      
      expect(breadPrice).toBeDefined();
      expect(breadPrice?.priceRub).toBe(finalPrice);
    });

    it('handles null prices for items without price data', () => {
      const product = repo.createProduct({
        name: 'Продукт без цены в чеке',
        energyKcal: 100,
      });

      repo.upsertPantryItem({
        displayName: product.name,
        productId: product.id,
        location: 'pantry',
        unit: 'g',
        quantityG: 500,
      });

      const recipe = repo.createRecipe({
        name: 'Рецепт с неизвестной ценой',
        cookedYieldG: 500,
        ingredients: [
          {
            productId: product.id,
            displayName: product.name,
            rawGrams: 200,
          },
        ],
      });

      const plan = repo.createMealPlanDraft({
        startDateLocal: '2026-10-20',
        days: 3,
      });

      repo.addPlannedMeal({
        dateLocal: '2026-10-20',
        meal: 'dinner',
        displayName: recipe.name,
        grams: 250,
        recipeId: recipe.id,
      });

      const shoppingList = repo.createShoppingListFromPlan(plan.id);
      const items = repo.listShoppingItems(shoppingList.id);

      const itemWithoutPrice = items.find((i) => i.displayName.includes('без цены'));
      if (itemWithoutPrice) {
        expect(itemWithoutPrice.priceRub).toBeNull();
      }
    });
  });

  describe('snapshot v14 validation', () => {
    it('snapshot version is 14', () => {
      const snapshot = repo.toSnapshot();
      expect(snapshot.version).toBe(14);
    });

    it('snapshot includes all Food Planner entities', () => {
      const snapshot = repo.toSnapshot();
      
      expect(snapshot.pantryItems).toBeDefined();
      expect(Array.isArray(snapshot.pantryItems)).toBe(true);
      
      expect(snapshot.cookedBatches).toBeDefined();
      expect(Array.isArray(snapshot.cookedBatches)).toBe(true);
      
      expect(snapshot.mealPlans).toBeDefined();
      expect(Array.isArray(snapshot.mealPlans)).toBe(true);
      
      expect(snapshot.plannedMeals).toBeDefined();
      expect(Array.isArray(snapshot.plannedMeals)).toBe(true);
      
      expect(snapshot.shoppingLists).toBeDefined();
      expect(Array.isArray(snapshot.shoppingLists)).toBe(true);
      
      expect(snapshot.shoppingItems).toBeDefined();
      expect(Array.isArray(snapshot.shoppingItems)).toBe(true);
      
      expect(snapshot.productPrices).toBeDefined();
      expect(Array.isArray(snapshot.productPrices)).toBe(true);
      
      expect(snapshot.foodBudgets).toBeDefined();
      expect(Array.isArray(snapshot.foodBudgets)).toBe(true);
      
      expect(snapshot.foodExpenses).toBeDefined();
      expect(Array.isArray(snapshot.foodExpenses)).toBe(true);
    });

    it('can import and export v14 snapshot', () => {
      const product = repo.createProduct({
        name: 'Экспорт тест',
        energyKcal: 100,
      });

      repo.addPlannedMeal({
        dateLocal: '2026-10-20',
        meal: 'breakfast',
        displayName: product.name,
        grams: 100,
        productId: product.id,
      });

      const exported = repo.toSnapshot();
      expect(exported.version).toBe(14);
      expect(exported.products.length).toBe(1);
      expect(exported.plannedMeals.length).toBe(1);

      const repo2 = createFoodRepository();
      repo2.importSnapshot(exported);

      const imported = repo2.toSnapshot();
      expect(imported.version).toBe(14);
      expect(imported.products.length).toBe(1);
      expect(imported.plannedMeals.length).toBe(1);
    });
  });
});
