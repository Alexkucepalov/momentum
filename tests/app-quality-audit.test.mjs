import test from "node:test";
import assert from "node:assert/strict";
import { loadSrcModules } from "./loadTsModules.mjs";
const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods["storage/foodRepository"];
const { parseExportJson } = mods["domain/importExport"];
const { completedTrainingFacts } = mods["domain/completedTraining"];
const make = () => createMemoryFoodRepository({ timezone: "UTC" });
const nutrition = { kcal: 180, protein: 10, fat: 5, carbs: 22 };
const day = "2026-11-14";

test("malformed import cannot replace valid data, including nested sections and duplicate ids", () => {
  const r = make();
  r.addQuickEntry({
    dateLocal: day,
    meal: "lunch",
    displayName: "Synthetic lunch",
    energyKcal: 200,
  });
  const original = r.toSnapshot();
  const cases = [
    (s) => {
      delete s.entries[0].createdAt;
    },
    (s) => {
      delete s.products[0].proteinG;
    },
    (s) => {
      s.profile = [];
    },
    (s) => {
      s.profile.timezone = "bad/timezone";
    },
    (s) => {
      s.profile.waterTargetMl = "2000";
    },
    (s) => {
      s.products[0].energyKcal = -1;
    },
    (s) => {
      s.entries[0].grams = null;
    },
    (s) => {
      s.entries[0].meal = "bad";
    },
    (s) => {
      s.entries[0].dateLocal = "2026-02-30";
    },
    (s) => {
      s.waterEntries = {};
    },
    (s) => {
      s.sleepNights = [null];
    },
    (s) => {
      s.products.push(s.products[0]);
    },
    (s) => {
      s.savedMeals = [{ id: "bad", name: "Synthetic", items: [null] }];
    },
    (s) => {
      s.trainingCycle = {
        name: "Cycle",
        slots: [
          { weekdayIndex: 9, title: "Ride", kind: "cardio", sortOrder: 0 },
        ],
      };
    },
    (s) => {
      s.workoutSessions = [
        {
          id: "s",
          dateLocal: day,
          title: "Test",
          status: "unknown",
          startedAt: "bad",
        },
      ];
    },
  ];
  for (const mutate of cases) {
    const bad = structuredClone(original);
    mutate(bad);
    const json = JSON.stringify(bad);
    assert.equal(parseExportJson(json).ok, false);
    assert.throws(() => r.importAll(json));
    assert.deepEqual(r.toSnapshot(), original);
  }
});
test("legacy imports remain supported and explicit null water target survives round-trip", () => {
  const r = make();
  r.setWaterTargetMl(null);
  const s = r.toSnapshot();
  assert.equal(parseExportJson(JSON.stringify(s)).ok, true);
  r.importAll(JSON.stringify(s));
  assert.equal(r.getProfile().waterTargetMl, null);
  const old = {
    version: 1,
    profile: { id: "legacy", timezone: "UTC", locale: "ru", units: "metric" },
    products: [],
    recipes: [],
    entries: [],
  };
  r.importAll(JSON.stringify(old));
  assert.equal(r.getProfile().waterTargetMl, 2000);
});
test("invalid recipe edits do not partially rename or remove ingredients; deletion is reversible", () => {
  const r = make();
  const recipe = r.createRecipe({
    name: "Synthetic recipe",
    cookedYieldG: 400,
    ingredients: [
      {
        displayName: "Synthetic ingredient",
        rawGrams: 200,
        nutritionPer100g: nutrition,
      },
    ],
  });
  const before = r.toSnapshot();
  for (const patch of [
    { name: "Changed", cookedYieldG: -1 },
    { name: "Changed", nutritionPer100g: null, ingredients: [] },
    {
      ingredients: [
        { displayName: "Invalid", rawGrams: NaN, nutritionPer100g: nutrition },
      ],
    },
  ]) {
    assert.throws(() => r.updateRecipe(recipe.id, patch));
    assert.deepEqual(r.toSnapshot(), before);
  }
  r.softDeleteRecipe(recipe.id);
  assert.equal(r.getRecipe(recipe.id), null);
  r.restoreRecipe(recipe.id);
  assert.equal(r.getRecipe(recipe.id).name, recipe.name);
  assert.equal(r.getRecipeIngredients(recipe.id).length, 1);
});
test("habit validation is atomic and quantity events never silently become one", () => {
  const r = make();
  const h = r.createFlexibleHabit("Synthetic pages", 3, {
    kind: "quantity",
    unit: "стр",
    targetValue: 50,
  });
  r.setFlexibleHabitDayValue(h.id, day, 18);
  const before = r.toSnapshot();
  assert.throws(() =>
    r.updateFlexibleHabit(h.id, { name: "Changed", targetValue: NaN }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  assert.throws(() => r.logFlexibleHabit(h.id, day, -2));
  assert.throws(() => r.logFlexibleHabit(h.id, "2026-02-30", 5));
  assert.deepEqual(r.toSnapshot(), before);
  r.softDeleteFlexibleHabit(h.id);
  r.restoreFlexibleHabit(h.id);
  assert.equal(r.flexibleHabitDayValue(h.id, day), 18);
});
test("completed training includes strength sessions, omits plans/drafts and preserves unknown duration", () => {
  const sessions = [
    {
      id: "done",
      title: "Synthetic strength",
      status: "completed",
      startedAt: "2026-11-14T09:00:00Z",
      completedAt: "2026-11-14T09:45:00Z",
      feelingNote: null,
      deletedAt: null,
    },
    {
      id: "unknown",
      title: "Old session",
      status: "completed",
      startedAt: "invalid",
      completedAt: null,
      deletedAt: null,
    },
    { id: "draft", status: "in_progress", deletedAt: null },
    { id: "abandoned", status: "abandoned", deletedAt: null },
    { id: "deleted", status: "completed", deletedAt: "2026-11-14T10:00:00Z" },
  ];
  const facts = completedTrainingFacts([], sessions);
  assert.equal(facts.length, 2);
  assert.equal(facts[0].durationSec, 2700);
  assert.equal(facts[1].durationSec, null);
  assert.equal(facts[0].calories, null);
  const r = make();
  const s = r.toSnapshot();
  s.workoutSessions = sessions.slice(0, 1).map((x) => ({
    ...x,
    dateLocal: day,
    templateId: null,
    plannedActivityId: null,
    feelingRpe: null,
    createdAt: x.startedAt,
  }));
  r.importAll(JSON.stringify(s));
  assert.equal(r.activityMinutesForDate(day), 45);
});
test("pantry and expense validation happens before mutation and soft deletes can be undone", () => {
  const r = make();
  const p = r.upsertPantryItem({
    displayName: "Synthetic milk",
    location: "fridge",
    unit: "ml",
    quantityG: null,
  });
  const e = r.addFoodExpense({
    amountRub: 120,
    category: "groceries",
    spentOn: day,
  });
  const before = r.toSnapshot();
  assert.throws(() => r.upsertPantryItem({ ...p, expiresOn: "2026-02-30" }));
  assert.throws(() =>
    r.addFoodExpense({
      amountRub: 15,
      category: "groceries",
      spentOn: "2026-13-01",
    }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  r.softDeletePantryItem(p.id);
  r.restorePantryItem(p.id);
  assert.equal(r.listPantryItems()[0].quantityG, null);
  r.softDeleteFoodExpense(e.id);
  r.restoreFoodExpense(e.id);
  assert.equal(r.listFoodExpenses("2026-11")[0].amountRub, 120);
});
test("receipt rejects invalid date and overflow before creating catalog, pantry, price or budget rows", () => {
  const r = make();
  const before = r.toSnapshot();
  const input = {
    status: "delivered",
    sourceKind: "manual",
    purchasedOn: day,
    lines: [
      {
        rawName: "Synthetic",
        displayName: "Synthetic",
        quantity: 1e-320,
        unit: "g",
        lineTotalRub: 100,
        unitPriceRub: null,
        discountRub: null,
        isFood: true,
        excluded: false,
      },
    ],
  };
  assert.throws(() => r.confirmNewPurchase(input));
  assert.deepEqual(r.toSnapshot(), before);
  assert.throws(() =>
    r.confirmNewPurchase({ ...input, purchasedOn: "2026-02-30" }),
  );
  assert.deepEqual(r.toSnapshot(), before);
});

test("planning edits do not touch the diary, validate relocation, and log Undo restores stock and planned status", () => {
  const r = make();
  const recipe = r.createRecipe({
    name: "Synthetic soup",
    cookedYieldG: 500,
    nutritionPer100g: nutrition,
  });
  const batch = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 500,
    cookedAt: day + "T10:00:00Z",
  });
  const plan = r.addPlannedMeal({
    dateLocal: day,
    meal: "lunch",
    displayName: recipe.name,
    recipeId: recipe.id,
    grams: 150,
  });
  assert.equal(r.listEntriesForDate(day).length, 0);
  const before = r.toSnapshot();
  assert.throws(() =>
    r.movePlannedMeal(plan.id, { dateLocal: "2026-02-30", meal: "dinner" }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  const entry = r.logPlannedMealToDiary(plan.id);
  assert.equal(
    r.listCookedBatches().find((b) => b.id === batch.id).remainingG,
    350,
  );
  r.undoPlannedMealLog(plan.id, entry.id);
  assert.equal(r.listEntriesForDate(day).length, 0);
  assert.equal(r.listPlannedMealsForDate(day)[0].status, "planned");
  assert.equal(
    r.listCookedBatches().find((b) => b.id === batch.id).remainingG,
    500,
  );
  r.softDeletePlannedMeal(plan.id);
  r.restorePlannedMeal(plan.id);
  assert.equal(r.listPlannedMealsForDate(day)[0].dateLocal, day);
});

test("shopping price overflow never partially changes displayed line or observations", () => {
  const r = make();
  const list = r.createEmptyShoppingList("Synthetic basket");
  const item = r.addShoppingItem({
    listId: list.id,
    displayName: "Synthetic flour",
    quantity: 1,
    unit: "g",
  });
  r.setShoppingItemPrice(item.id, {
    priceRub: 100,
    priceAsOf: day,
    priceSource: "user",
  });
  const before = r.toSnapshot();
  assert.throws(() =>
    r.setShoppingItemPrice(item.id, {
      priceRub: Number.MAX_VALUE,
      priceAsOf: day,
    }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  assert.throws(() =>
    r.setShoppingItemPrice(item.id, { priceRub: 100, priceAsOf: "2026-02-30" }),
  );
  assert.deepEqual(r.toSnapshot(), before);
});

test("manual weight correction and Undo preserve date and source, integration records stay read-only", () => {
  const r = make();
  const entry = r.addWeight(75.5, day + "T08:00:00Z");
  const publicRow = r.listWeights()[0];
  publicRow.kg = 999;
  assert.equal(r.latestWeight().kg, 75.5);
  const changed = r.updateManualWeight(entry.id, 75.2);
  assert.equal(changed.weighedAt, entry.weighedAt);
  r.updateManualWeight(entry.id, entry.kg);
  assert.deepEqual(r.latestWeight(), entry);
  const removed = r.removeManualWeight(entry.id);
  assert.equal(r.latestWeight(), null);
  r.restoreManualWeight(removed);
  assert.deepEqual(r.latestWeight(), entry);
  const before = r.toSnapshot();
  assert.throws(() => r.addWeight(70, "bad"));
  assert.deepEqual(r.toSnapshot(), before);
  const integrated = r.upsertIntegratedWeight({
    kg: 74,
    weighedAt: day + "T09:00:00Z",
    source: "garmin",
    externalId: "synthetic-garmin-weight",
  });
  const next = r.toSnapshot();
  assert.throws(() => r.updateManualWeight(integrated.id, 70));
  assert.throws(() => r.removeManualWeight(integrated.id));
  assert.deepEqual(r.toSnapshot(), next);
});

test("meal suggestions never invent preparation times from product type or pantry presence", () => {
  const r = make();
  const p = r.createProduct({ name: "Synthetic oats", energyKcal: 300 });
  const recipe = r.createRecipe({
    name: "Synthetic bowl",
    cookedYieldG: 500,
    nutritionPer100g: nutrition,
  });
  const { eatNowInputsFromProducts, eatNowInputsFromRecipes } =
    mods["domain/buildEatNowInputs"];
  assert.equal(eatNowInputsFromProducts([p])[0].prepMinutes, null);
  assert.equal(
    eatNowInputsFromRecipes([recipe], () => [])[0].prepMinutes,
    null,
  );
});

test("receipt price basis is explicit and basket/eaten estimates use the purchased quantity", () => {
  const r = make();
  const { parsePurchaseLine } = mods["domain/parsePurchasePaste"];
  const line = parsePurchaseLine("Synthetic flour 2 кг × 100");
  assert.equal(line.quantity, 2000);
  assert.equal(line.lineTotalRub, 200);
  const purchase = r.confirmNewPurchase({
    status: "delivered",
    sourceKind: "paste",
    purchasedOn: day,
    lines: [line],
  });
  const pp = r.toSnapshot().productPrices.find((p) => p.source === "receipt");
  assert.equal(pp.basisQuantity, 1);
  assert.equal(pp.priceRub, 0.1);
  const p = r.listProducts().find((p) => p.id === purchase.lines[0].productId);
  r.addEntryFromProduct({
    productId: p.id,
    dateLocal: day,
    meal: "lunch",
    grams: 250,
  });
  assert.equal(r.monthEatenCostEstimate("2026-11").totalRub, 25);
  const recipe = r.createRecipe({
    name: "Synthetic dough",
    cookedYieldG: 2500,
    ingredients: [
      {
        displayName: p.name,
        productId: p.id,
        rawGrams: 2500,
        nutritionPer100g: nutrition,
      },
    ],
  });
  const list = r.createShoppingListFromRecipe(recipe.id);
  const item = r.listShoppingItems(list.id)[0];
  assert.equal(item.needToBuy, 500);
  assert.equal(item.priceRub, 50);
  const snap = r.toSnapshot();
  r.importAll(JSON.stringify(snap));
  assert.equal(r.monthEatenCostEstimate("2026-11").totalRub, 25);
  const legacy = r.toSnapshot();
  legacy.productPrices.forEach((p) => delete p.basisQuantity);
  r.importAll(JSON.stringify(legacy));
  assert.equal(r.monthEatenCostEstimate("2026-11").totalRub, null);
  assert.equal(r.toSnapshot().productPrices[0].priceRub, 0.1);
});

test("Android privacy configuration excludes automatic cloud backup and microphone permission", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = JSON.parse(
    await readFile(new URL("../apps/mobile/app.json", import.meta.url), "utf8"),
  ).expo;
  assert.equal(config.android.allowBackup, false);
  assert.ok(
    config.android.blockedPermissions.includes(
      "android.permission.RECORD_AUDIO",
    ),
  );
});

test("shopping line price is divided by piece count before recording a per-piece observation", () => {
  const r = make();
  const list = r.createEmptyShoppingList("Synthetic pieces");
  const item = r.addShoppingItem({
    listId: list.id,
    displayName: "Synthetic bottles",
    quantity: 3,
    unit: "pcs",
  });
  r.setShoppingItemPrice(item.id, { priceRub: 120, priceAsOf: day });
  const price = r.toSnapshot().productPrices[0];
  assert.equal(price.priceRub, 40);
  assert.equal(price.basisQuantity, 1);
  assert.equal(r.listShoppingItems(list.id)[0].priceRub, 120);
});

test("widget wipe waits for in-flight writes and is not blocked by a failed update", async () => {
  const { createSerialWidgetWrites } = mods["widgets/serialWidgetWrites"];
  const writes = createSerialWidgetWrites();
  let release;
  const slow = new Promise((resolve) => {
    release = resolve;
  });
  let stored = null;
  const old = writes.run(async () => {
    await slow;
    stored = "synthetic private metrics";
  });
  const wipe = writes.run(async () => {
    stored = null;
  });
  release();
  await Promise.all([old, wipe]);
  assert.equal(stored, null);
  const fail = writes.run(async () => {
    throw new Error("Synthetic disk failure");
  });
  const cleanup = writes.run(async () => {
    stored = null;
  });
  await assert.rejects(fail);
  await cleanup;
  assert.equal(stored, null);
});

test("completed strength credits matching habit once and counts in challenges; minutes never become kilometres", () => {
  const r = make();
  const date = new Date().toISOString().slice(0, 10);
  const checkbox = r.createFlexibleHabit("Synthetic training day", 3, {
    autoSource: "strength",
  });
  const km = r.createFlexibleHabit("Synthetic distance", 3, {
    kind: "quantity",
    unit: "км",
    targetValue: 10,
    autoSource: "cycling",
  });
  const challenge = r.createChallenge({
    name: "Synthetic sessions",
    metric: "workouts_count",
    target: 3,
    periodStart: date,
    periodEnd: date,
  });
  const session = r.startWorkoutSession({
    dateLocal: date,
    title: "Synthetic strength",
  });
  assert.equal(r.challengeProgress(challenge.id).current, 0);
  r.completeWorkoutSession(session.id);
  r.completeWorkoutSession(session.id);
  assert.equal(r.flexibleHabitDayValue(checkbox.id, date), 1);
  assert.equal(r.challengeProgress(challenge.id).current, 1);
  r.addWorkout({ dateLocal: date, type: "cycling", durationSec: 1800 });
  assert.equal(r.flexibleHabitDayValue(km.id, date), 0);
  assert.equal(r.challengeProgress(challenge.id).current, 2);
});
