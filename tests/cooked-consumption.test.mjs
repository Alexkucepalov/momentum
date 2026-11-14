import test from "node:test";
import assert from "node:assert/strict";
import { loadSrcModules } from "./loadTsModules.mjs";
const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods["storage/foodRepository"];
const { entryDetails } = mods["domain/diaryEntry"];
const day = "2026-11-14";
const nutrition = { kcal: 200, protein: 10, fat: null, carbs: 30 };
function fixture() {
  const r = createMemoryFoodRepository({ timezone: "UTC" });
  const recipe = r.createRecipe({
    name: "Synthetic soup",
    cookedYieldG: 200,
    nutritionPer100g: nutrition,
  });
  const a = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 70,
    cookedAt: day + "T08:00:00Z",
  });
  const b = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 130,
    cookedAt: day + "T09:00:00Z",
  });
  const add = (grams = 150) =>
    r.addEntryFromRecipe({
      recipeId: recipe.id,
      dateLocal: day,
      meal: "lunch",
      grams,
    });
  return { r, recipe, a, b, add };
}
const remaining = (r, id) =>
  r.listCookedBatches().find((b) => b.id === id)?.remainingG;
const reopen = (r) =>
  createMemoryFoodRepository({ snapshot: JSON.parse(r.exportAll()) });
test("FIFO spans batches and provenance survives export/import/restart", () => {
  const { r, a, b, add } = fixture();
  const e = add();
  assert.deepEqual(e.cookedConsumption, [
    { batchId: a.id, grams: 70 },
    { batchId: b.id, grams: 80 },
  ]);
  assert.equal(remaining(r, a.id), 0);
  assert.equal(remaining(r, b.id), 50);
  const fresh = reopen(r);
  assert.deepEqual(
    fresh.listEntriesForDate(day)[0].cookedConsumption,
    e.cookedConsumption,
  );
  fresh.softDeleteEntry(e.id);
  assert.equal(remaining(fresh, a.id), 70);
  assert.equal(remaining(fresh, b.id), 130);
  const deleted = reopen(fresh);
  deleted.undoDeleteEntry(e.id);
  assert.equal(remaining(deleted, a.id), 0);
  assert.equal(remaining(deleted, b.id), 50);
});
test("delete/undo/add-undo are idempotent and never restore one portion twice", () => {
  const { r, a, b, add } = fixture();
  const e = add();
  r.softDeleteEntry(e.id);
  r.softDeleteEntry(e.id);
  r.undoDiaryAdds([e.id, e.id]);
  assert.equal(remaining(r, a.id), 70);
  assert.equal(remaining(r, b.id), 130);
  r.undoDeleteEntry(e.id);
  r.undoDeleteEntry(e.id);
  assert.equal(remaining(r, a.id), 0);
  assert.equal(remaining(r, b.id), 50);
  r.undoDiaryAdds([e.id, e.id]);
  r.undoDiaryAdds([e.id]);
  assert.equal(remaining(r, a.id), 70);
  assert.equal(remaining(r, b.id), 130);
});
test("gram edits scale historical nutrition and known stock; Undo restores exact batches", () => {
  const { r, recipe, a, b, add } = fixture();
  const e = add();
  const previous = entryDetails(e);
  const reduced = r.updateEntryGrams(e.id, 75);
  assert.equal(reduced.energyKcal, 150);
  assert.equal(reduced.fatG, null);
  assert.equal(remaining(r, a.id), 35);
  assert.equal(remaining(r, b.id), 90);
  r.updateEntryDetails(e.id, previous);
  assert.equal(remaining(r, a.id), 0);
  assert.equal(remaining(r, b.id), 50);
  const c = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 100,
    cookedAt: day + "T10:00:00Z",
  });
  r.updateEntryGrams(e.id, 250);
  assert.equal(remaining(r, b.id), 0);
  assert.equal(remaining(r, c.id), 50);
  r.updateEntryDetails(e.id, previous);
  assert.equal(remaining(r, a.id), 0);
  assert.equal(remaining(r, b.id), 50);
  assert.equal(remaining(r, c.id), 100);
});
test("growing a partly unstocked portion only consumes the new grams", () => {
  const { r, recipe, add } = fixture();
  const e = add(300);
  assert.equal(
    e.cookedConsumption.reduce((s, p) => s + p.grams, 0),
    200,
  );
  const c = r.createCookedBatch({
    recipeId: recipe.id,
    initialYieldG: 200,
    cookedAt: day + "T11:00:00Z",
  });
  const next = r.updateEntryGrams(e.id, 350);
  assert.equal(remaining(r, c.id), 150);
  assert.equal(
    next.cookedConsumption.reduce((s, p) => s + p.grams, 0),
    250,
  );
});
test("legacy portions never invent stock origin; their copies start a fresh provenance record", () => {
  const { r, a, b, add } = fixture();
  const e = add();
  const snap = r.toSnapshot();
  delete snap.entries.find((x) => x.id === e.id).cookedConsumption;
  const old = createMemoryFoodRepository({ snapshot: snap });
  old.updateEntryGrams(e.id, 75);
  old.softDeleteEntry(e.id);
  old.undoDeleteEntry(e.id);
  assert.equal(remaining(old, a.id), 0);
  assert.equal(remaining(old, b.id), 50);
  const copy = old.copyDiaryEntries({
    items: [{ entryId: e.id, grams: 100 }],
    dateLocal: day,
  })[0];
  assert.deepEqual(copy.cookedConsumption, [{ batchId: b.id, grams: 50 }]);
  old.undoDiaryAdds([copy.id]);
  assert.equal(remaining(old, b.id), 50);
});
test("deleted/missing batches are not recreated by diary edits or Undo", () => {
  const { r, a, b, add } = fixture();
  const e = add();
  r.softDeleteCookedBatch(a.id);
  r.softDeleteEntry(e.id);
  assert.equal(remaining(r, a.id), undefined);
  assert.equal(remaining(r, b.id), 130);
  r.undoDeleteEntry(e.id);
  assert.equal(remaining(r, a.id), undefined);
  assert.equal(remaining(r, b.id), 50);
  const snap = r.toSnapshot();
  snap.cookedBatches = snap.cookedBatches.filter((x) => x.id !== a.id);
  r.importAll(JSON.stringify(snap));
  r.softDeleteEntry(e.id);
  assert.equal(remaining(r, a.id), undefined);
  assert.equal(remaining(r, b.id), 130);
});
test("failed Undo cannot partially consume another available batch or restore the diary row", () => {
  const { r, recipe, a, b, add } = fixture();
  const e = add();
  r.softDeleteEntry(e.id);
  // Consume the second batch only, leaving the first available for the failed restore.
  const snap = r.toSnapshot();
  snap.cookedBatches.find((x) => x.id === a.id).deletedAt = day + "T12:00:00Z";
  r.importAll(JSON.stringify(snap));
  r.addEntryFromRecipe({
    recipeId: recipe.id,
    dateLocal: day,
    meal: "dinner",
    grams: 130,
  });
  const again = r.toSnapshot();
  again.cookedBatches.find((x) => x.id === a.id).deletedAt = null;
  r.importAll(JSON.stringify(again));
  const before = r.toSnapshot();
  assert.throws(() => r.undoDeleteEntry(e.id));
  assert.deepEqual(r.toSnapshot(), before);
  assert.equal(remaining(r, a.id), 70);
  assert.equal(remaining(r, b.id), 0);
});
test("nested provenance never leaks mutable repository objects through entry reads/snapshots", () => {
  const { r, add } = fixture();
  const e = add();
  e.cookedConsumption[0].grams = 999;
  const before = r.toSnapshot();
  r.listEntriesForDate(day)[0].cookedConsumption[0].grams = 999;
  r.listRecentEntries()[0].cookedConsumption[0].grams = 999;
  r.toSnapshot().entries[0].cookedConsumption[0].grams = 999;
  assert.deepEqual(r.toSnapshot(), before);
});
test("malformed provenance import leaves diary and stock unchanged", () => {
  const { r, add } = fixture();
  add();
  const before = r.toSnapshot();
  const invalid = [
    null,
    [{ batchId: "x", grams: -1 }],
    [{ batchId: "x", grams: 151 }],
    [
      { batchId: "x", grams: 10 },
      { batchId: "x", grams: 20 },
    ],
  ];
  for (const value of invalid) {
    const bad = structuredClone(before);
    bad.entries[0].cookedConsumption = value;
    assert.throws(() => r.importAll(JSON.stringify(bad)));
    assert.deepEqual(r.toSnapshot(), before);
  }
});

test("moving a tracked entry to another meal/date preserves stock and its update time", () => {
  const { r, add } = fixture();
  const entry = add();
  const before = r.toSnapshot().cookedBatches;
  r.updateEntryDetails(entry.id, {
    ...entryDetails(entry),
    dateLocal: "2026-11-15",
    meal: "dinner",
  });
  assert.deepEqual(r.toSnapshot().cookedBatches, before);
  assert.equal(r.listEntriesForDate("2026-11-15")[0].meal, "dinner");
});
