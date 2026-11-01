/**
 * FI Quality Sprint — grocery → meal → shop → budget chain (synthetic only).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = JSON.parse(
  readFileSync(join(root, 'docs/fixtures/synthetic-purchases.json'), 'utf8'),
);

const mods = loadSrcModules();
const { parsePurchasePaste } = mods['domain/parsePurchasePaste'];
const { recipePantryCoverage } = mods['domain/recipePantryCoverage'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

function confirmFromPaste(repo, paste, purchasedOn = '2026-10-20') {
  const parsed = parsePurchasePaste(paste);
  return {
    parsed,
    result: repo.confirmNewPurchase({
      status: 'delivered',
      sourceKind: 'paste',
      purchasedOn,
      storeLabel: parsed.storeLabel,
      totalRub: parsed.totalRub,
      parseConfidence: parsed.parseConfidence,
      lines: parsed.lines.map((l) => ({
        rawName: l.rawName,
        displayName: l.displayName,
        quantity: l.quantity,
        unit: l.unit,
        packageSizeText: l.packageSizeText,
        unitPriceRub: l.unitPriceRub,
        lineTotalRub: l.lineTotalRub,
        discountRub: l.discountRub,
        isFood: l.isFood,
        excluded: l.excluded,
      })),
    }),
  };
}

test('fixtures: Пятёрочка skips discount; parses weight kg; excludes bag', () => {
  const p = parsePurchasePaste(fixtures.pyaterochka.paste);
  assert.equal(p.storeLabel, 'Пятёрочка');
  assert.equal(p.totalRub, 288.89);
  assert.ok(p.warnings.some((w) => /скидк/i.test(w)));
  assert.equal(p.lines.some((l) => /скидк/i.test(l.displayName)), false);
  const bananas = p.lines.find((l) => /банан/i.test(l.displayName));
  assert.equal(bananas.quantity, 1240);
  assert.equal(bananas.unit, 'g');
  const bag = p.lines.find((l) => /пакет/i.test(l.displayName));
  assert.equal(bag.isFood, false);
  assert.equal(bag.excluded, true);
});

test('fixtures: METRO approx weight + null price + bare Итого', () => {
  const p = parsePurchasePaste(fixtures.metro.paste);
  assert.equal(p.totalRub, null);
  assert.ok(p.warnings.some((w) => /итого/i.test(w)));
  assert.equal(p.lines.some((l) => /^итого/i.test(l.displayName)), false);
  const chicken = p.lines.find((l) => /куриц/i.test(l.displayName));
  assert.equal(chicken.quantity, 850);
  assert.equal(chicken.unit, 'g');
  assert.equal(chicken.lineTotalRub, 420);
  const butter = p.lines.find((l) => /масло/i.test(l.displayName));
  assert.equal(butter.quantity, 180);
  assert.equal(butter.lineTotalRub, null);
});

test('fixtures: Самокат qty×price and non-food fees', () => {
  const p = parsePurchasePaste(fixtures.samokat.paste);
  const yogurt = p.lines.find((l) => /йогурт/i.test(l.displayName));
  assert.equal(yogurt.quantity, 2);
  assert.equal(yogurt.unit, 'pcs');
  assert.equal(yogurt.unitPriceRub, 79);
  assert.equal(yogurt.lineTotalRub, 158);
  assert.equal(p.lines.filter((l) => !l.isFood).length, 2);
});

test('E2E: confirm → pantry/expense; re-import blocked; snapshot v14', () => {
  const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
  const { result } = confirmFromPaste(repo, fixtures.chizhik.paste);
  assert.equal(repo.toSnapshot().version, 18);
  assert.ok(result.purchase.confirmedAt);
  const pantryBefore = repo.listPantryItems().length;
  assert.ok(pantryBefore >= 3);
  assert.ok(result.pantryItems.every((p) => p.source === 'purchase'));
  assert.ok(result.expense);
  assert.equal(result.expense.amountRub, 257);
  const expensesBefore = repo.listFoodExpenses('2026-10').length;

  assert.throws(() => confirmFromPaste(repo, fixtures.chizhik.paste), /дубликат/i);
  assert.equal(repo.listPantryItems().length, pantryBefore);
  assert.equal(repo.listFoodExpenses('2026-10').length, expensesBefore);
});

test('E2E: METRO null totals → expense null (unknown ≠ 0); pantry still written', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const { result } = confirmFromPaste(repo, fixtures.metro.paste);
  assert.equal(result.expense, null);
  assert.equal(result.purchase.totalRub, null);
  assert.ok(result.pantryItems.length >= 2);
  const butter = result.lines.find((l) => /масло/i.test(l.displayName));
  assert.equal(butter.lineTotalRub, null);
});

test('E2E: pantry coverage → meal plan → missing-only shop; plan ≠ diary', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  confirmFromPaste(repo, fixtures.chizhik.paste);

  const recipe = repo.createRecipe({
    name: 'Сырники тест',
    cookedYieldG: 400,
    nutritionPer100g: { kcal: 180, protein: 14, fat: 8, carbs: 12 },
    ingredients: [
      {
        displayName: 'Творог 5%',
        rawGrams: 360,
        nutritionPer100g: { kcal: 120, protein: 16, fat: 5, carbs: 3 },
      },
      {
        displayName: 'Яйцо С1',
        rawGrams: 40,
        nutritionPer100g: { kcal: 155, protein: 13, fat: 11, carbs: 1 },
      },
      {
        displayName: 'Мука',
        rawGrams: 40,
        nutritionPer100g: { kcal: 340, protein: 10, fat: 1, carbs: 70 },
      },
    ],
  });

  const coverage = recipePantryCoverage(
    repo.getRecipeIngredients(recipe.id),
    repo.listPantryItems(),
  );
  assert.equal(coverage.matchedCount, 2);
  assert.deepEqual(coverage.missing, ['Мука']);
  assert.equal(coverage.fullyCovered, false);

  const plan = repo.createMealPlanDraft({ startDateLocal: '2026-10-21', days: 3 });
  for (const m of repo.listPlannedMeals(plan.id)) {
    repo.replacePlannedMeal(m.id, {
      recipeId: recipe.id,
      displayName: recipe.name,
      grams: 200,
    });
  }
  const diaryBefore = repo.dailyTotals('2026-10-21').entryCount;
  const list = repo.createShoppingListFromPlan(plan.id);
  assert.equal(repo.dailyTotals('2026-10-21').entryCount, diaryBefore, 'planned ≠ eaten');

  const items = repo.listShoppingItems(list.id);
  assert.equal(items.every((i) => i.needToBuy > 0), true);
  assert.ok(items.some((i) => /мука/i.test(i.displayName)));
  assert.equal(
    items.some((i) => /творог/i.test(i.displayName) && i.needToBuy <= 0),
    false,
  );
});

test('E2E: recipe edit after diary log keeps entry snapshot macros', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Овсянка',
    cookedYieldG: 300,
    nutritionPer100g: { kcal: 100, protein: 4, fat: 2, carbs: 18 },
    ingredients: [
      {
        displayName: 'Овсянка',
        rawGrams: 300,
        nutritionPer100g: { kcal: 100, protein: 4, fat: 2, carbs: 18 },
      },
    ],
  });
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-20',
    meal: 'breakfast',
    grams: 150,
  });
  assert.equal(entry.energyKcal, 150);
  repo.updateRecipe(recipe.id, {
    name: 'Овсянка',
    cookedYieldG: 300,
    nutritionPer100g: { kcal: 999, protein: 99, fat: 99, carbs: 99 },
  });
  const again = repo.listEntriesForDate('2026-10-20').find((e) => e.id === entry.id);
  assert.ok(again);
  assert.equal(again.energyKcal, 150);
  assert.notEqual(again.energyKcal, 999);
});

test('E2E: budget projection incomplete without prices; no live «сегодня»', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  confirmFromPaste(repo, fixtures.metro.paste);
  const recipe = repo.createRecipe({
    name: 'Плов',
    cookedYieldG: 500,
    nutritionPer100g: { kcal: 150, protein: 8, fat: 5, carbs: 20 },
    ingredients: [
      {
        displayName: 'Рис круглозёрный',
        rawGrams: 300,
        nutritionPer100g: { kcal: 130, protein: 3, fat: 0, carbs: 28 },
      },
      {
        displayName: 'Специи редкие',
        rawGrams: 20,
        nutritionPer100g: { kcal: 10, protein: 0, fat: 0, carbs: 2 },
      },
    ],
  });
  const plan = repo.createMealPlanDraft({ startDateLocal: '2026-10-22', days: 3 });
  for (const m of repo.listPlannedMeals(plan.id)) {
    repo.replacePlannedMeal(m.id, { recipeId: recipe.id, displayName: recipe.name, grams: 250 });
  }
  repo.createShoppingListFromPlan(plan.id);
  const proj = repo.openShoppingProjection();
  assert.equal(proj.totalRub, null);
  assert.equal(proj.incomplete, true);
  assert.ok(!/сегодня/i.test(proj.label));

  const eaten = repo.monthEatenCostEstimate('2026-10');
  assert.equal(eaten.totalCount, 0);
  // no diary → no invented eaten cost
  assert.equal(eaten.totalRub, null);
});

test('E2E: Самокат fees excluded from pantry; total expense uses order total', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const { result, parsed } = confirmFromPaste(repo, fixtures.samokat.paste);
  assert.equal(parsed.lines.filter((l) => l.excluded).length, 2);
  assert.equal(result.pantryItems.every((p) => !/доставк|сборк/i.test(p.displayName)), true);
  assert.equal(result.expense.amountRub, 495);
});
