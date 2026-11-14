import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository, weekStartMonday } = mods['storage/foodRepository'];
const { localDateKey } = mods['storage/validation'];
const { recipePortion } = mods['domain/nutrition'];
const { normalizeOffProduct } = mods['integrations/openFoodFacts'];

test('product entry snapshot survives product macro change conceptually', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Oats',
    energyKcal: 100,
    proteinG: 10,
    fatG: 2,
    carbG: 20,
  });
  const entry = repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 50,
  });
  assert.equal(entry.energyKcal, 50);
  assert.equal(entry.proteinG, 5);
  // Historical snapshot stays on entry; new entries use updated product macros
  repo.updateProductNutrition(product.id, {
    energyKcal: 200,
    proteinG: 20,
    fatG: 4,
    carbG: 40,
  });
  assert.equal(entry.energyKcal, 50);
  const next = repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 50,
  });
  assert.equal(next.energyKcal, 100);
  assert.equal(next.proteinG, 10);
});

test('recipe entry accepts nutrition snapshot override', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Soup',
    cookedYieldG: 500,
    ingredients: [
      {
        displayName: 'Mix',
        rawGrams: 400,
        nutritionPer100g: { kcal: 100, protein: 5, fat: 2, carbs: 10 },
      },
    ],
  });
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-17',
    meal: 'lunch',
    grams: 200,
    nutritionSnapshot: {
      energyKcal: 77,
      proteinG: 3,
      fatG: null,
      carbG: 8,
    },
  });
  assert.equal(entry.energyKcal, 77);
  assert.equal(entry.proteinG, 3);
  assert.equal(entry.fatG, null);
  assert.equal(entry.carbG, 8);
});

test('unknown nutrition stays null in daily totals', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Mystery',
    energyKcal: 200,
    proteinG: null,
    fatG: 5,
    carbG: 10,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'lunch',
    grams: 100,
  });
  const totals = repo.dailyTotals('2026-10-17');
  assert.equal(totals.energyKcal, 200);
  assert.equal(totals.proteinG, null);
  assert.equal(totals.hasUnknownFields, true);
});

test('soft delete + undo', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({ name: 'Bread', energyKcal: 250, proteinG: 8, fatG: 3, carbG: 45 });
  const entry = repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'snack',
    grams: 40,
  });
  repo.softDeleteEntry(entry.id);
  assert.equal(repo.listEntriesForDate('2026-10-17').length, 0);
  repo.undoDeleteEntry(entry.id);
  assert.equal(repo.listEntriesForDate('2026-10-17').length, 1);
});

test('recipe cooked yield portion matches domain math', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Stew',
    cookedYieldG: 800,
    ingredients: [
      {
        displayName: 'Mix',
        rawGrams: 500,
        nutritionPer100g: { kcal: 200, protein: 10, fat: 5, carbs: 25 },
      },
    ],
  });
  const expected = recipePortion(
    [{ grams: 500, nutritionPer100g: { kcal: 200, protein: 10, fat: 5, carbs: 25 } }],
    800,
    200,
  );
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-17',
    meal: 'dinner',
    grams: 200,
  });
  assert.equal(entry.energyKcal, expected.kcal);
  assert.equal(entry.energyKcal, 250);
});

test('multi-ingredient recipe portion uses snapshots', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const recipe = repo.createRecipe({
    name: 'Pasta',
    cookedYieldG: 800,
    ingredients: [
      {
        displayName: 'Pasta',
        rawGrams: 300,
        nutritionPer100g: { kcal: 350, protein: 12, fat: 2, carbs: 70 },
      },
      {
        displayName: 'Sauce',
        rawGrams: 200,
        nutritionPer100g: { kcal: 80, protein: 2, fat: 4, carbs: 8 },
      },
    ],
  });
  // raw total kcal = 300*3.5 + 200*0.8 = 1050 + 160 = 1210
  // 200g of 800g cooked => 1210 * 200/800 = 302.5
  const entry = repo.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: '2026-10-17',
    meal: 'lunch',
    grams: 200,
  });
  assert.equal(entry.energyKcal, 302.5);
  assert.equal(repo.getRecipeIngredients(recipe.id).length, 2);
});

test('reject zero cooked yield', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  assert.throws(() =>
    repo.createRecipe({
      name: 'Bad',
      cookedYieldG: 0,
      ingredients: [
        { displayName: 'X', rawGrams: 100, nutritionPer100g: { kcal: 1, protein: 0, fat: 0, carbs: 0 } },
      ],
    }),
  );
});

test('snapshot round-trip restores entries', () => {
  const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
  const p = repo.createProduct({ name: 'Rice', energyKcal: 130, proteinG: 2.5, fatG: 0.3, carbG: 28 });
  repo.addEntryFromProduct({ productId: p.id, dateLocal: '2026-10-17', meal: 'lunch', grams: 150 });
  const snap = repo.toSnapshot();
  const restored = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(restored.listEntriesForDate('2026-10-17').length, 1);
  assert.equal(restored.dailyTotals('2026-10-17').entryCount, 1);
});

test('export then deleteAll clears data', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.createProduct({ name: 'Tea', energyKcal: 1, proteinG: 0, fatG: 0, carbG: 0 });
  const json = repo.exportAll();
  assert.match(json, /Tea/);
  repo.deleteAllUserData();
  // Everyday seed catalog is restored after wipe (offline name search).
  assert.ok(repo.listProducts().some((p) => p.id.startsWith('seed:')));
  assert.equal(repo.listProducts().some((p) => p.name === 'Tea'), false);
  assert.match(json, /Tea/);
});

test('water and weight persist in snapshot', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.addWater('2026-10-17', 250);
  repo.addWater('2026-10-17', 250);
  assert.equal(repo.waterMlForDate('2026-10-17'), 500);
  repo.addWeight(76.4);
  assert.equal(repo.latestWeight()?.kg, 76.4);
  repo.toggleHabit('2026-10-17', 'walk');
  assert.equal(repo.isHabitDone('2026-10-17', 'walk'), true);
  const snap = repo.toSnapshot();
  assert.equal(snap.version, 20);
  const restored = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(restored.waterMlForDate('2026-10-17'), 500);
  assert.equal(restored.latestWeight()?.kg, 76.4);
  assert.equal(restored.isHabitDone('2026-10-17', 'walk'), true);
});

test('normalizeOffProduct keeps null macros and rejects missing name', () => {
  const incomplete = normalizeOffProduct('3017620422003', {
    status: 1,
    product: { nutriments: { 'energy-kcal_100g': 100 } },
  });
  assert.equal(incomplete.status, 'incomplete');

  const ok = normalizeOffProduct('3017620422003', {
    status: 1,
    product: {
      product_name: 'Synthetic jam',
      brands: 'Fixture Co',
      nutriments: {
        'energy-kcal_100g': 250,
        proteins_100g: 1.2,
        fat_100g: 0.5,
        // carbs intentionally missing → null, not 0
      },
    },
  });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.carbG, null);
  assert.equal(ok.energyKcal, 250);
  assert.equal(ok.brand, 'Fixture Co');

  const missing = normalizeOffProduct('000', { status: 0 });
  assert.equal(missing.status, 'not_found');

  const malformed = normalizeOffProduct('3017620422003', { error: 'rate_limit' });
  assert.equal(malformed.status, 'unusable');

  const empty = normalizeOffProduct('3017620422003', null);
  assert.equal(empty.status, 'unusable');

  const stubName = normalizeOffProduct('4810268059353', {
    status: 1,
    product: { product_name: '4810268059353', nutriments: {} },
  });
  assert.equal(stubName.status, 'incomplete');

  // Real CIS stub: GTIN in name_ru, real name in another lang + macros
  const multilingual = normalizeOffProduct('4810268059353', {
    status: 1,
    product: {
      product_name: '4810268059353',
      product_name_ru: '4810268059353',
      product_name_sr: 'Киви алма',
      brands: 'Teos',
      nutriments: {
        'energy-kcal_100g': 68.2,
        proteins_100g: 4.5,
        fat_100g: 1.5,
        carbohydrates_100g: 8,
      },
    },
  });
  assert.equal(multilingual.status, 'ok');
  assert.equal(multilingual.name, 'Киви алма');
  assert.equal(multilingual.brand, 'Teos');
  assert.equal(multilingual.energyKcal, 68.2);
});

test('normalizeOffProduct prefers Russian name', () => {
  const ok = normalizeOffProduct('4600702000000', {
    status: 1,
    product: {
      product_name: 'Kefir',
      product_name_ru: 'Кефир 3,2%',
      brands: 'Простоквашино',
      nutriments: {
        'energy-kcal_100g': 56,
        proteins_100g: 2.9,
        fat_100g: 3.2,
        carbohydrates_100g: 4.0,
      },
    },
  });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.name, 'Кефир 3,2%');
  assert.equal(ok.brand, 'Простоквашино');
});

test('barcode upsert caches catalog product and prefers local lookup', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const saved = repo.upsertFromOffResult({
    status: 'ok',
    barcode: '4600000000000',
    name: 'Fixture yogurt',
    brand: 'Test',
    energyKcal: 80,
    proteinG: 4,
    fatG: 2,
    carbG: 8,
    sourceUpdatedAt: null,
    attribution: 'Open Food Facts',
  });
  assert.equal(saved.source, 'catalog');
  assert.equal(repo.findProductByBarcode('4600000000000')?.id, saved.id);
  const again = repo.upsertFromOffResult({
    status: 'ok',
    barcode: '4600000000000',
    name: 'Fixture yogurt updated',
    brand: 'Test',
    energyKcal: 82,
    proteinG: 4,
    fatG: 2,
    carbG: null,
    sourceUpdatedAt: null,
    attribution: 'Open Food Facts',
  });
  assert.equal(again.id, saved.id);
  assert.equal(again.energyKcal, 82);
  assert.equal(again.carbG, null);
});

test('flexible habit weekly target without streak shame', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const habit = repo.createFlexibleHabit('Stretch', 3);
  assert.equal(habit.timesPerWeek, 3);
  assert.equal(habit.deletedAt, null);
  assert.equal(weekStartMonday('2026-10-17'), '2026-10-12'); // Sat → Mon Oct 12
  repo.logFlexibleHabit(habit.id, '2026-10-13');
  repo.logFlexibleHabit(habit.id, '2026-10-15');
  const stats = repo.flexibleHabitWeekStats(habit.id, '2026-10-17');
  assert.equal(stats.completed, 2);
  assert.equal(stats.target, 3);
  assert.equal(stats.weekStart, '2026-10-12');
  assert.equal(repo.isFlexibleHabitLogged(habit.id, '2026-10-15'), true);
  repo.unlogFlexibleHabit(habit.id, '2026-10-15');
  assert.equal(repo.flexibleHabitWeekStats(habit.id, '2026-10-17').completed, 1);
  const snap = repo.toSnapshot();
  assert.equal(snap.flexibleHabits.length, 1);
  const restored = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(restored.flexibleHabitWeekStats(habit.id, '2026-10-17').completed, 1);
});

test('flexible habit update and soft delete', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const habit = repo.createFlexibleHabit('Walk', 2);
  const updated = repo.updateFlexibleHabit(habit.id, { name: 'Прогулка', timesPerWeek: 5 });
  assert.equal(updated.name, 'Прогулка');
  assert.equal(updated.timesPerWeek, 5);
  assert.equal(repo.listFlexibleHabits().length, 1);
  repo.softDeleteFlexibleHabit(habit.id);
  assert.equal(repo.listFlexibleHabits().length, 0);
  assert.throws(() => repo.logFlexibleHabit(habit.id, '2026-10-17'));
  assert.throws(() => repo.updateFlexibleHabit(habit.id, { name: 'X' }));
});

test('manual workout does not affect food totals', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Oats',
    energyKcal: 100,
    proteinG: 10,
    fatG: 2,
    carbG: 20,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 100,
  });
  repo.addWorkout({
    dateLocal: '2026-10-17',
    type: 'cycling',
    durationSec: 2700,
    distanceM: 12000,
  });
  assert.equal(repo.activityMinutesForDate('2026-10-17'), 45);
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 100);
  repo.softDeleteWorkout(repo.listWorkoutsForDate('2026-10-17')[0].id);
  assert.equal(repo.activityMinutesForDate('2026-10-17'), 0);
  assert.equal(repo.dailyTotals('2026-10-17').energyKcal, 100);
});

test('v1 snapshot migrates waterTarget default', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 1,
      profile: { id: 'p', timezone: 'UTC', locale: 'en', units: 'metric' },
      products: [],
      recipes: [],
      ingredients: [],
      entries: [],
    },
  });
  assert.equal(repo.getProfile().waterTargetMl, 2000);
});

test('localDateKey formats in timezone', () => {
  const key = localDateKey(new Date('2026-10-17T01:30:00Z'), 'America/Los_Angeles');
  assert.equal(key, '2026-10-16');
});

test('lastGramsForProduct returns newest portion', async () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Kefir',
    barcode: '4601234567890',
    energyKcal: 50,
    proteinG: 3,
    fatG: 2,
    carbG: 4,
  });
  assert.equal(repo.lastGramsForProduct(product.id), null);
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-16',
    meal: 'breakfast',
    grams: 200,
  });
  // Same-ms creates can tie on createdAt; brief gap so newest is unambiguous
  await new Promise((r) => setTimeout(r, 5));
  const second = repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'snack',
    grams: 150,
  });
  assert.equal(second.grams, 150);
  assert.equal(repo.lastGramsForProduct(product.id), 150);
});

test('listRecentEntries dedupes same product+grams', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const product = repo.createProduct({
    name: 'Syrniki',
    energyKcal: 300,
    proteinG: 16,
    fatG: 5,
    carbG: 9,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 250,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'breakfast',
    grams: 250,
  });
  repo.addEntryFromProduct({
    productId: product.id,
    dateLocal: '2026-10-17',
    meal: 'lunch',
    grams: 100,
  });
  const recent = repo.listRecentEntries(10);
  const same250 = recent.filter((e) => e.productId === product.id && e.grams === 250);
  assert.equal(same250.length, 1);
  assert.equal(recent.filter((e) => e.productId === product.id).length, 2);
});
