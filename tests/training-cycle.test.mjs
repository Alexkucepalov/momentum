import test from "node:test";
import assert from "node:assert/strict";
import { loadSrcModules } from "./loadTsModules.mjs";
const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods["storage/foodRepository"];
const { parseExportJson } = mods["domain/importExport"];
const make = () => createMemoryFoodRepository({ timezone: "UTC" });
const slots = [
  {
    weekdayIndex: 0,
    kind: "strength",
    title: "Upper",
    subtitle: null,
    templateId: "tmpl-upper-a",
    timeLocal: "19:30",
    cardioMinutes: null,
    sortOrder: 0,
  },
  {
    weekdayIndex: 4,
    kind: "cardio",
    title: "Ride",
    subtitle: "Easy",
    templateId: null,
    timeLocal: "18:00",
    cardioMinutes: 60,
    sortOrder: 0,
  },
];
test("cycle survives v20 export/import; week exceptions never rewrite template", () => {
  const r = make();
  r.saveTrainingCycle({ name: "My cycle", slots });
  r.applyTrainingCycleWeek("2026-11-16");
  const ride = r.listPlannedActivitiesForDate("2026-11-20")[0];
  r.updatePlannedActivity(ride.id, { cardioMinutes: 90 });
  r.movePlannedActivity(ride.id, { dateLocal: "2026-11-21" });
  assert.equal(r.getTrainingCycle().slots[1].cardioMinutes, 60);
  r.applyTrainingCycleWeek("2026-11-23");
  assert.equal(
    r.listPlannedActivitiesForDate("2026-11-27")[0].cardioMinutes,
    60,
  );
  const parsed = parseExportJson(r.exportAll());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.snapshot.version, 20);
  const restored = createMemoryFoodRepository({ snapshot: parsed.snapshot });
  assert.deepEqual(restored.getTrainingCycle(), r.getTrainingCycle());
  const exposed = restored.getTrainingCycle();
  exposed.slots[0].title = "Mutated";
  assert.equal(restored.getTrainingCycle().slots[0].title, "Upper");
});
test("invalid cycle replacement and missing templates cannot delete the week", () => {
  const r = make();
  r.saveTrainingCycle({ name: "Cycle", slots });
  r.applyTrainingCycleWeek("2026-11-16");
  const before = r.toSnapshot();
  assert.throws(() =>
    r.saveTrainingCycle({
      name: "Bad",
      slots: [{ ...slots[0], weekdayIndex: 9 }],
    }),
  );
  assert.deepEqual(r.toSnapshot(), before);
  r.softDeleteWorkoutTemplate("tmpl-upper-a");
  const plans = r.listPlannedActivitiesInWeek("2026-11-16");
  assert.throws(() =>
    r.applyTrainingCycleWeek("2026-11-16", { replace: true }),
  );
  assert.deepEqual(r.listPlannedActivitiesInWeek("2026-11-16"), plans);
});
test("explicit ride link is unique, undoable, persisted, and never moves Garmin history", () => {
  const r = make();
  const ride = r.upsertIntegratedWorkout({
    source: "garmin",
    externalId: "qa-ride",
    dateLocal: "2026-11-10",
    type: "cycling",
    durationSec: 3600,
    distanceM: 22000,
  });
  const a = r.addPlannedActivity({
    dateLocal: "2026-11-09",
    kind: "cardio",
    title: "Ride",
  });
  const b = r.copyPlannedActivity(a.id, { dateLocal: "2026-11-11" });
  const before = r.getWorkoutById(ride.id);
  r.linkPlannedCycling(a.id, ride.id);
  assert.throws(() => r.linkPlannedCycling(b.id, ride.id));
  assert.deepEqual(r.getWorkoutById(ride.id), before);
  const copy = r.copyPlannedActivity(a.id, { dateLocal: "2026-11-12" });
  assert.equal(copy.linkedWorkoutId, null);
  const restored = createMemoryFoodRepository({ snapshot: r.toSnapshot() });
  assert.equal(
    restored.listPlannedActivitiesForDate(a.dateLocal)[0].linkedWorkoutId,
    ride.id,
  );
  restored.linkPlannedCycling(a.id, null);
  assert.equal(
    restored.listPlannedActivitiesForDate(a.dateLocal)[0].linkedWorkoutId,
    null,
  );
});
test("legacy v19 upgrades without losing facts; wipe clears cycle and links", () => {
  const r = make();
  r.saveTrainingCycle({ name: "Cycle", slots });
  const snap = r.toSnapshot();
  snap.version = 19;
  delete snap.trainingCycle;
  const old = createMemoryFoodRepository({ snapshot: snap });
  assert.equal(old.toSnapshot().version, 20);
  assert.equal(old.getTrainingCycle(), null);
  r.deleteAllUserData();
  assert.equal(r.getTrainingCycle(), null);
  assert.equal(r.toSnapshot().plannedActivities.length, 0);
  assert.equal(
    parseExportJson(JSON.stringify({ ...snap, version: 20 })).ok,
    true,
  );
  assert.equal(
    parseExportJson(JSON.stringify({ ...snap, version: 21 })).ok,
    false,
  );
});
test("four-week fill skips edited weeks, coalesces persistence and restores only its own changes", async () => {
  const r = make();
  r.saveTrainingCycle({ name: "Cycle", slots });
  const original = r.addPlannedActivity({
    dateLocal: "2026-11-16",
    kind: "rest",
    title: "My exception",
  });
  let writes = 0;
  r.setPersistHook(() => writes++);
  const result = r.fillTrainingCycleWeeks("2026-11-16", 4);
  await Promise.resolve();
  assert.equal(result.skippedWeeks, 1);
  assert.equal(result.createdIds.length, 6);
  assert.equal(writes, 1);
  assert.deepEqual(r.listPlannedActivitiesForDate(original.dateLocal), [
    original,
  ]);
  result.createdIds.forEach((id) => r.softDeletePlannedActivity(id));
  assert.deepEqual(r.listPlannedActivitiesForDate(original.dateLocal), [
    original,
  ]);
  assert.equal(r.listPlannedActivitiesInWeek("2026-11-23").length, 0);
  const saved = r.getTrainingCycle();
  r.saveTrainingCycle({ name: "Changed", slots: [] });
  r.restoreTrainingCycle(saved);
  assert.deepEqual(r.getTrainingCycle(), saved);
  r.restoreTrainingCycle(null);
  assert.equal(r.getTrainingCycle(), null);
});
