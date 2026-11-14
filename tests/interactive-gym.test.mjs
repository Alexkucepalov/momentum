import test from "node:test";
import assert from "node:assert/strict";
import { loadSrcModules } from "./loadTsModules.mjs";
const modules = loadSrcModules();
const { createMemoryFoodRepository } = modules["storage/foodRepository"];
const { buildSessionReview, previousExercisePerformance, sessionDurationSec } =
  modules["domain/strength/sessionReview"];
const { initialSetFieldValues } = modules["domain/strength/setLogPrefill"];
function fixture() {
  const repo = createMemoryFoodRepository({ timezone: "UTC" });
  const exercise = repo.createStrengthExercise({
    name: "Synthetic movement",
    primaryMuscles: ["back"],
    equipment: "cable",
  });
  const template = repo.createWorkoutTemplate({
    name: "Synthetic session",
    exercises: [
      {
        exerciseId: exercise.id,
        targetSets: 2,
        targetRepsMin: 7,
        targetRepsMax: 11,
        restSec: 80,
        notes: "Synthetic exercise note",
      },
    ],
  });
  repo.updateWorkoutTemplate(template.id, { notes: "Synthetic plan note" });
  const session = repo.startWorkoutSession({
    dateLocal: "2026-11-14",
    title: template.name,
    templateId: template.id,
  });
  return {
    repo,
    exercise,
    template,
    session,
    sets: repo.listWorkoutSets(session.id),
  };
}
const stable = (raw) => {
  const { exportedAt, ...data } = JSON.parse(raw);
  return data;
};
const reopen = (repo) =>
  createMemoryFoodRepository({ snapshot: JSON.parse(repo.exportAll()) });
test("unconfirmed input including explicit empty fields survives reload without counting as a result", () => {
  const { repo, sets, session } = fixture();
  repo.saveWorkoutSetDraft(sets[0].id, { weight: "17,5", reps: "" });
  const again = reopen(repo),
    draft = again.listWorkoutSets(session.id)[0];
  assert.deepEqual(initialSetFieldValues(draft), { weight: "17,5", reps: "" });
  assert.equal(draft.weightKg, null);
  assert.equal(draft.completed, false);
  const review = buildSessionReview(
    again.getWorkoutSession(session.id),
    again.listWorkoutSets(session.id),
  );
  assert.equal(review.completedSets, 0);
  assert.equal(review.repetitions, null);
});
test("plan, name and local notes are frozen at session start and deeply copied", () => {
  const { repo, template, session } = fixture();
  const frozen = repo.getWorkoutSession(session.id);
  repo.updateWorkoutTemplate(template.id, {
    name: "Changed later",
    notes: "Changed later",
  });
  repo.setTemplateExercises(template.id, []);
  assert.deepEqual(
    repo.getWorkoutSession(session.id).exercisePlan,
    frozen.exercisePlan,
  );
  assert.equal(
    repo.getWorkoutSession(session.id).planNotes,
    "Synthetic plan note",
  );
  const returned = repo.getWorkoutSession(session.id);
  returned.exercisePlan[0].name = "Mutated";
  returned.exercisePlan[0].primaryMuscles.push("legs");
  const exported = repo.toSnapshot();
  exported.workoutSessions[0].exercisePlan[0].name = "Mutated snapshot";
  assert.deepEqual(
    repo.getWorkoutSession(session.id).exercisePlan,
    frozen.exercisePlan,
  );
  assert.deepEqual(
    reopen(repo).getWorkoutSession(session.id).exercisePlan,
    frozen.exercisePlan,
  );
});
test("record clears draft, persists rest; editing preserves completion time and skipped rest stays skipped", () => {
  const { repo, session, sets } = fixture();
  repo.saveWorkoutSetDraft(sets[0].id, { weight: "17", reps: "9" });
  const recorded = repo.completeWorkoutSet(sets[0].id, {
    weightKg: 17,
    reps: 9,
  });
  assert.equal(recorded.draftWeightText, undefined);
  const deadline = repo.getWorkoutSession(session.id).restUntilAt;
  assert.ok(Date.parse(deadline) > Date.now());
  assert.equal(
    reopen(repo).getWorkoutSession(session.id).restUntilAt,
    deadline,
  );
  repo.setSessionRestDeadline(session.id, null);
  repo.completeWorkoutSet(sets[0].id, { weightKg: 18, reps: 10 });
  assert.equal(
    repo.listWorkoutSets(session.id)[0].completedAt,
    recorded.completedAt,
  );
  assert.equal(reopen(repo).getWorkoutSession(session.id).restUntilAt, null);
});
test("Undo restores original draft and optional unknown actual values, not inferred targets", () => {
  const { repo, sets, session } = fixture();
  repo.saveWorkoutSetDraft(sets[0].id, { weight: "", reps: "9" });
  const before = repo.listWorkoutSets(session.id)[0];
  repo.completeWorkoutSet(before.id, { weightKg: null, reps: 9 });
  repo.restoreWorkoutSet(before);
  repo.setSessionRestDeadline(session.id, null);
  assert.deepEqual(repo.listWorkoutSets(session.id)[0], before);
  assert.equal(
    buildSessionReview(
      repo.getWorkoutSession(session.id),
      repo.listWorkoutSets(session.id),
    ).completedSets,
    0,
  );
});
test("last set ends rest; closed sessions reject drafts and Undo without changing history", () => {
  const { repo, session, sets } = fixture();
  for (const set of sets)
    repo.completeWorkoutSet(set.id, { weightKg: null, reps: 9 });
  assert.equal(repo.getWorkoutSession(session.id).restUntilAt, null);
  repo.completeWorkoutSession(session.id);
  const before = repo.exportAll();
  assert.throws(() =>
    repo.saveWorkoutSetDraft(sets[0].id, { weight: "1", reps: "1" }),
  );
  assert.throws(() => repo.restoreWorkoutSet(sets[0]));
  assert.throws(() =>
    repo.setSessionRestDeadline(session.id, new Date().toISOString()),
  );
  assert.deepEqual(stable(repo.exportAll()), stable(before));
});
test("unknown repetitions are not zero or a counted range result", () => {
  const { repo, session, sets } = fixture();
  repo.completeWorkoutSet(sets[0].id, { weightKg: null, reps: null });
  const a = buildSessionReview(
    repo.getWorkoutSession(session.id),
    repo.listWorkoutSets(session.id),
  );
  assert.equal(a.completedSets, 1);
  assert.equal(a.repetitions, null);
  assert.equal(a.incompleteReps, true);
  assert.equal(a.exercises[0].inRange, null);
  repo.completeWorkoutSet(sets[1].id, { weightKg: 0, reps: 0 });
  const b = buildSessionReview(
    repo.getWorkoutSession(session.id),
    repo.listWorkoutSets(session.id),
  );
  assert.equal(b.repetitions, 0);
  assert.equal(b.knownRepSets, 1);
  assert.equal(b.exercises[0].inRange, 0);
  assert.equal(b.exercises[0].checkedRangeSets, 1);
});
test("range follows the frozen plan; extra sets remain session-only", () => {
  const { repo, session, sets, exercise, template } = fixture();
  repo.completeWorkoutSet(sets[0].id, { weightKg: 17, reps: 9 });
  repo.completeWorkoutSet(sets[1].id, { weightKg: 17, reps: 13 });
  repo.upsertWorkoutSet({
    sessionId: session.id,
    exerciseId: exercise.id,
    setIndex: 3,
    weightKg: 18,
    reps: 8,
    completed: true,
  });
  const review = buildSessionReview(
    repo.getWorkoutSession(session.id),
    repo.listWorkoutSets(session.id),
  );
  assert.equal(review.totalSets, 3);
  assert.equal(review.exercises[0].inRange, 2);
  assert.equal(repo.listTemplateExercises(template.id)[0].targetSets, 2);
});
test("a historical review never uses a future session or uncompleted/deleted sets as previous", () => {
  const { repo, session, sets, exercise } = fixture();
  const snap = repo.toSnapshot();
  const current = { ...session, startedAt: "2026-11-14T10:00:00Z" };
  const previous = {
    ...session,
    id: "prior",
    status: "completed",
    dateLocal: "2026-11-12",
    startedAt: "2026-11-12T10:00:00Z",
    completedAt: "2026-11-12T11:00:00Z",
  };
  const future = {
    ...previous,
    id: "future",
    dateLocal: "2026-11-15",
    startedAt: "2026-11-15T10:00:00Z",
    completedAt: "2026-11-15T11:00:00Z",
  };
  const base = { ...sets[0], completed: true, weightKg: 17, reps: 9 };
  const history = [
    { ...base, id: "a", sessionId: "prior" },
    { ...base, id: "b", sessionId: "future", weightKg: 99 },
  ];
  const result = previousExercisePerformance(
    exercise.id,
    current,
    [future, previous],
    history,
  );
  assert.equal(result.session.id, "prior");
  assert.equal(result.sets[0].weightKg, 17);
  assert.equal(
    previousExercisePerformance(exercise.id, current, [future], history),
    null,
  );
  assert.equal(
    previousExercisePerformance(
      exercise.id,
      current,
      [previous],
      [{ ...history[0], deletedAt: "2026-11-13T10:00:00Z" }],
    ),
    null,
  );
});
test("missing original plan on legacy sessions stays unknown after reload", () => {
  const { repo, session } = fixture();
  const snap = repo.toSnapshot();
  delete snap.workoutSessions[0].exercisePlan;
  delete snap.workoutSessions[0].restUntilAt;
  repo.importAll(JSON.stringify(snap));
  const again = reopen(repo);
  assert.equal(again.getWorkoutSession(session.id).exercisePlan, undefined);
  assert.equal(
    buildSessionReview(
      again.getWorkoutSession(session.id),
      again.listWorkoutSets(session.id),
    ).exercises[0].plan,
    undefined,
  );
});
test("invalid frozen plan or oversized draft fails import atomically", () => {
  const { repo } = fixture(),
    before = repo.exportAll();
  for (const change of [
    (s) => {
      s.workoutSessions[0].exercisePlan[0].targetSets = 1.5;
    },
    (s) => {
      s.workoutSessions[0].exercisePlan[0].primaryMuscles = "back";
    },
    (s) => {
      s.workoutSets[0].draftWeightText = "1".repeat(33);
    },
    (s) => {
      s.workoutSessions[0].restUntilAt = "bad";
    },
  ]) {
    const next = JSON.parse(before);
    change(next);
    assert.throws(() => repo.importAll(JSON.stringify(next)));
    assert.deepEqual(stable(repo.exportAll()), stable(before));
  }
});
test("invalid replacement template lines preserve all previous exercises", () => {
  const { repo, template, exercise } = fixture();
  const before = repo.exportAll();
  assert.throws(() =>
    repo.setTemplateExercises(template.id, [
      { exerciseId: exercise.id, targetSets: 2 },
      { exerciseId: "absent", targetSets: 2 },
    ]),
  );
  assert.deepEqual(stable(repo.exportAll()), stable(before));
  assert.throws(() =>
    repo.setTemplateExercises(template.id, [
      { exerciseId: exercise.id, targetSets: 1.5 },
    ]),
  );
  assert.deepEqual(stable(repo.exportAll()), stable(before));
});
test("duration does not invent an end time or accept negative chronology", () => {
  const { session } = fixture();
  assert.equal(sessionDurationSec(session), null);
  assert.equal(
    sessionDurationSec({
      ...session,
      startedAt: "2026-11-14T11:00:00Z",
      completedAt: "2026-11-14T10:00:00Z",
    }),
    null,
  );
});

test("freezing a plan preserves longer legacy exercise notes and fractional rest rather than truncating history", () => {
  const { repo, template, exercise } = fixture();
  const note = "Synthetic description. ".repeat(250);
  repo.setTemplateExercises(template.id, [
    {
      exerciseId: exercise.id,
      targetSets: 2,
      targetRepsMin: 7,
      targetRepsMax: 11,
      restSec: 80.5,
      notes: note,
    },
  ]);
  const session = repo.startWorkoutSession({
    dateLocal: "2026-11-15",
    title: "Synthetic later",
    templateId: template.id,
  });
  assert.equal(session.exercisePlan[0].notes, note.trim());
  assert.equal(
    reopen(repo).getWorkoutSession(session.id).exercisePlan[0].restSec,
    80.5,
  );
});

test("custom equipment labels cannot resolve prototype properties instead of text", () => {
  const { equipmentLabel } = modules["domain/strength/sessionReview"];
  for (const label of [
    "__proto__",
    "constructor",
    "toString",
    "Synthetic equipment",
  ])
    assert.equal(equipmentLabel(label), label);
  assert.equal(equipmentLabel("dumbbell"), "Гантели");
  assert.equal(equipmentLabel(null), "Оборудование не указано");
});
