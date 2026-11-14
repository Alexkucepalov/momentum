import test from "node:test";
import assert from "node:assert/strict";
import { loadSrcModules } from "./loadTsModules.mjs";
const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods["storage/foodRepository"];
const { entryDetails, resizeEntrySnapshot, entryAmountLabel } =
  mods["domain/diaryEntry"];
const make = () => createMemoryFoodRepository({ timezone: "UTC" });
const day = "2026-11-13";
function deleteProduct(r, id) {
  const snap = r.toSnapshot();
  snap.products = snap.products.filter((p) => p.id !== id);
  r.importAll(JSON.stringify(snap));
}
function product(r) {
  return r.createProduct({
    name: "Synthetic oats",
    energyKcal: 200,
    proteinG: 10,
    fatG: null,
    carbG: 30,
  });
}
test("editing historical grams preserves its snapshot after catalog changes/deletion and supports exact Undo", () => {
  const r = make();
  const p = product(r);
  const e = r.addEntryFromProduct({
    productId: p.id,
    dateLocal: day,
    meal: "breakfast",
    grams: 100,
  });
  const previous = entryDetails(e);
  r.updateProductNutrition(p.id, {
    energyKcal: 900,
    proteinG: 80,
    fatG: 20,
    carbG: 70,
  });
  deleteProduct(r, p.id);
  const resized = r.updateEntryGrams(e.id, 50);
  assert.equal(resized.energyKcal, 100);
  assert.equal(resized.proteinG, 5);
  assert.equal(resized.fatG, null);
  r.updateEntryDetails(e.id, previous);
  assert.deepEqual(entryDetails(r.listEntriesForDate(day)[0]), previous);
  assert.throws(() => r.updateEntryGrams(e.id, Infinity));
  assert.deepEqual(entryDetails(r.listEntriesForDate(day)[0]), previous);
});
test("mixed repeat is atomic, includes Quick Add, keeps meals, unknowns and historical names", async () => {
  const r = make();
  const p = product(r);
  const e = r.addEntryFromProduct({
    productId: p.id,
    dateLocal: day,
    meal: "breakfast",
    grams: 100,
  });
  const q = r.addQuickEntry({
    dateLocal: day,
    meal: "dinner",
    displayName: "Synthetic quick",
    energyKcal: 350,
  });
  deleteProduct(r, p.id);
  const before = r.toSnapshot();
  assert.throws(() =>
    r.copyDiaryEntries({
      items: [{ entryId: e.id }, { entryId: "missing" }],
      dateLocal: "2026-11-14",
    }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  let writes = 0;
  r.setPersistHook(() => writes++);
  const copied = r.copyDiaryEntries({
    items: [{ entryId: e.id }, { entryId: q.id, grams: 2 }],
    dateLocal: "2026-11-14",
  });
  await Promise.resolve();
  assert.equal(writes, 1);
  assert.equal(copied.length, 2);
  assert.equal(copied[0].energyKcal, 200);
  assert.equal(copied[0].fatG, null);
  assert.equal(copied[0].meal, "breakfast");
  assert.equal(copied[1].energyKcal, 700);
  assert.equal(copied[1].meal, "dinner");
  assert.equal(copied[1].proteinG, null);
  assert.equal(entryAmountLabel(copied[1]), "2 порц.");
  assert.notEqual(copied[0].id, e.id);
  const reload = createMemoryFoodRepository({ snapshot: r.toSnapshot() });
  assert.deepEqual(reload.listEntriesForDate("2026-11-14"), copied);
  copied.forEach((e) => r.softDeleteEntry(e.id));
  assert.equal(r.listEntriesForDate("2026-11-14").length, 0);
  assert.equal(r.listEntriesForDate(day).length, 2);
});
test("relocation validates date and meal before mutation; restores exact original snapshot", () => {
  const r = make();
  const p = product(r);
  const e = r.addEntryFromProduct({
    productId: p.id,
    dateLocal: day,
    meal: "breakfast",
    grams: 120,
  });
  const before = entryDetails(e);
  assert.throws(() =>
    r.updateEntryDetails(e.id, { dateLocal: "2026-02-30", meal: "lunch" }),
  );
  assert.throws(() => r.updateEntryDetails(e.id, { meal: "invalid" }));
  assert.deepEqual(entryDetails(r.listEntriesForDate(day)[0]), before);
  r.updateEntryDetails(e.id, { dateLocal: "2026-11-14", meal: "snack" });
  assert.equal(r.listEntriesForDate(day).length, 0);
  assert.equal(r.listEntriesForDate("2026-11-14")[0].energyKcal, 240);
  r.updateEntryDetails(e.id, before);
  assert.deepEqual(entryDetails(r.listEntriesForDate(day)[0]), before);
});
test("saved meal with a deleted ingredient refuses to log partially", () => {
  const r = make();
  const a = product(r);
  const b = product(r);
  const saved = r.createSavedMeal({
    name: "Synthetic template",
    items: [a, b].map((p) => ({
      productId: p.id,
      recipeId: null,
      displayName: p.name,
      grams: 100,
    })),
  });
  deleteProduct(r, b.id);
  const before = r.toSnapshot();
  assert.throws(() =>
    r.logSavedMeal({ savedMealId: saved.id, dateLocal: day, meal: "lunch" }),
  );
  assert.deepEqual(r.toSnapshot(), before);
});
test("water removal/restore is idempotent and rejects invalid restores without mutation", () => {
  const r = make();
  const a = r.addWater(day, 250);
  const b = r.addWater(day, 500);
  const removed = r.removeWater(a.id);
  assert.equal(r.waterMlForDate(day), 500);
  assert.equal(r.removeWater(a.id), null);
  r.restoreWater(removed);
  assert.equal(r.waterMlForDate(day), 750);
  assert.throws(() => r.restoreWater(removed));
  assert.throws(() => r.restoreWater({ ...b, id: "bad", ml: Infinity }));
  assert.equal(r.waterMlForDate(day), 750);
});
test("habit absolute daily values change the weekly sum immediately and preserve independent days", () => {
  const r = make();
  const h = r.createFlexibleHabit("Synthetic stretch", 7, {
    kind: "quantity",
    unit: "мин",
    targetValue: 90,
  });
  r.setFlexibleHabitDayValue(h.id, day, 20);
  r.setFlexibleHabitDayValue(h.id, "2026-11-12", 15);
  r.setFlexibleHabitDayValue(h.id, day, 30);
  assert.equal(r.flexibleHabitWeekStats(h.id, day).completed, 45);
  assert.equal(r.flexibleHabitDayValue(h.id, day), 30);
  assert.throws(() => r.setFlexibleHabitDayValue(h.id, day, -3));
  r.setFlexibleHabitDayValue(h.id, day, 0);
  assert.equal(r.flexibleHabitWeekStats(h.id, day).completed, 15);
  r.setFlexibleHabitDayValue(h.id, day, 20);
  assert.equal(r.flexibleHabitWeekStats(h.id, day).completed, 35);
});
test("zero mass cannot invent nutrition; null remains distinct from measured zero", () => {
  const r = make();
  const p = product(r);
  const empty = r.addEntryFromProduct({
    productId: p.id,
    dateLocal: day,
    meal: "breakfast",
    grams: 0,
  });
  assert.throws(() => resizeEntrySnapshot(empty, 50));
  const zero = resizeEntrySnapshot({ ...empty, grams: 100, energyKcal: 0 }, 50);
  assert.equal(zero.energyKcal, 0);
  assert.equal(zero.fatG, null);
  assert.throws(() =>
    resizeEntrySnapshot(
      { ...empty, grams: 1, energyKcal: Number.MAX_VALUE },
      Number.MAX_VALUE,
    ),
  );
});

test("recipe repeat and gram editing keep original portion nutrition after recipe changes and deletion", () => {
  const r = make();
  const recipe = r.createRecipe({
    name: "Synthetic recipe",
    cookedYieldG: 300,
    ingredients: [],
    nutritionPer100g: { kcal: 120, protein: 5, fat: 3, carbs: 18 },
  });
  const e = r.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: day,
    meal: "lunch",
    grams: 150,
  });
  r.softDeleteRecipe(recipe.id);
  const edited = r.updateEntryGrams(e.id, 100);
  assert.equal(edited.energyKcal, 120);
  const copied = r.copyDiaryEntries({
    items: [{ entryId: e.id, grams: 200 }],
    dateLocal: "2026-11-14",
    meal: "snack",
  })[0];
  assert.equal(copied.energyKcal, 240);
  assert.equal(copied.recipeId, recipe.id);
  assert.equal(copied.displayName, "Synthetic recipe");
});

test("invalid log destinations and overflowing nutrition are rejected without any diary mutation", () => {
  const r = make();
  const p = product(r);
  const recipe = r.createRecipe({
    name: "Synthetic",
    cookedYieldG: 100,
    ingredients: [],
    nutritionPer100g: { kcal: 100, protein: null, fat: null, carbs: null },
  });
  const before = r.toSnapshot();
  for (const dateLocal of ["2026-02-30", "bad"])
    for (const add of [
      () =>
        r.addEntryFromProduct({
          productId: p.id,
          dateLocal,
          meal: "lunch",
          grams: 100,
        }),
      () =>
        r.addEntryFromRecipe({
          recipeId: recipe.id,
          dateLocal,
          meal: "lunch",
          grams: 100,
        }),
      () => r.addQuickEntry({ dateLocal, meal: "lunch", energyKcal: 100 }),
    ])
      assert.throws(add);
  assert.throws(() =>
    r.addEntryFromProduct({
      productId: p.id,
      dateLocal: day,
      meal: "invalid",
      grams: 100,
    }),
  );
  assert.throws(() =>
    r.addEntryFromProduct({
      productId: p.id,
      dateLocal: day,
      meal: "lunch",
      grams: Number.MAX_VALUE,
    }),
  );
  assert.deepEqual(r.toSnapshot(), before);
});

test("Undo of recipe adds restores only actual batch consumption and is idempotent", () => {
  const r = make();
  const recipe = r.createRecipe({
    name: "Synthetic batch",
    cookedYieldG: 300,
    ingredients: [],
    nutritionPer100g: { kcal: 120, protein: 5, fat: 3, carbs: 18 },
  });
  const batch = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 300,
    cookedAt: "2026-11-13T10:00:00Z",
  });
  const first = r.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: day,
    meal: "lunch",
    grams: 200,
  });
  const second = r.copyDiaryEntries({
    items: [{ entryId: first.id }],
    dateLocal: day,
    meal: "dinner",
  })[0];
  assert.equal(r.listCookedBatches({ recipeId: recipe.id })[0].remainingG, 0);
  r.undoDiaryAdds([second.id]);
  assert.equal(r.listCookedBatches({ recipeId: recipe.id })[0].remainingG, 100);
  r.undoDiaryAdds([second.id]);
  assert.equal(r.listCookedBatches({ recipeId: recipe.id })[0].remainingG, 100);
  r.undoDiaryAdds([first.id]);
  assert.equal(
    r.listCookedBatches({ recipeId: recipe.id })[0].remainingG,
    batch.initialYieldG,
  );
  assert.equal(r.listEntriesForDate(day).length, 0);
});
