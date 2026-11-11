import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { parseExportJson } = mods['domain/importExport'];
const {
  previousCompletedSetsForExercise,
  workingWeightFromSets,
} = mods['domain/strength/previousPerformance'];
const { materializeSeedExercises, materializeSeedTemplates } = mods['domain/strength/seedCatalog'];

describe('strength domain (snapshot v19)', () => {
  it('seeds RU templates and exercises on empty store', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const snap = repo.toSnapshot();
    assert.equal(snap.version, 19);
    assert.ok(repo.listStrengthExercises().length >= 8);
    const templates = repo.listWorkoutTemplates();
    assert.ok(templates.some((t) => t.name === 'Верх A'));
    assert.ok(templates.some((t) => t.name === 'Ноги + пресс'));
    const upperA = templates.find((t) => t.id === 'tmpl-upper-a');
    assert.ok(upperA);
    assert.ok(repo.listTemplateExercises(upperA.id).length >= 4);
  });

  it('start session prefills sets; unknown weight stays null', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-10',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    assert.equal(session.status, 'in_progress');
    const sets = repo.listWorkoutSets(session.id);
    assert.ok(sets.length >= 3);
    assert.ok(sets.every((s) => s.weightKg === null && s.completed === false));
    const first = sets[0];
    const done = repo.completeWorkoutSet(first.id, { weightKg: 40, reps: 10 });
    assert.equal(done.completed, true);
    assert.equal(done.weightKg, 40);
    assert.throws(() => repo.completeWorkoutSet(first.id, { weightKg: -1, reps: 10 }));
  });

  it('move planned activity does not rewrite completed session history', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const planned = repo.addPlannedActivity({
      dateLocal: '2026-11-10',
      kind: 'strength',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-10',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
      plannedActivityId: planned.id,
    });
    const set = repo.listWorkoutSets(session.id)[0];
    repo.completeWorkoutSet(set.id, { weightKg: 50, reps: 8 });
    repo.completeWorkoutSession(session.id);

    const moved = repo.movePlannedActivity(planned.id, { dateLocal: '2026-11-12' });
    assert.equal(moved.dateLocal, '2026-11-12');

    const hist = repo.getWorkoutSession(session.id);
    assert.equal(hist.dateLocal, '2026-11-10');
    assert.equal(hist.status, 'completed');
    assert.equal(repo.listWorkoutSets(session.id).find((s) => s.id === set.id).weightKg, 50);
  });

  it('copy planned activity leaves original in place', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const planned = repo.addPlannedActivity({
      dateLocal: '2026-11-10',
      kind: 'strength',
      title: 'Ноги + пресс',
      templateId: 'tmpl-legs',
    });
    const copy = repo.copyPlannedActivity(planned.id, { dateLocal: '2026-11-13' });
    assert.notEqual(copy.id, planned.id);
    assert.equal(copy.dateLocal, '2026-11-13');
    assert.equal(repo.getWorkoutTemplate(planned.templateId)?.id, 'tmpl-legs');
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-10').length, 1);
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-13').length, 1);
  });

  it('previousCompletedSetsForExercise reads last finished session only', () => {
    const sessions = [
      {
        id: 's1',
        dateLocal: '2026-11-01',
        templateId: null,
        plannedActivityId: null,
        title: 'A',
        status: 'completed',
        startedAt: '2026-11-01T10:00:00.000Z',
        completedAt: '2026-11-01T11:00:00.000Z',
        feelingRpe: null,
        feelingNote: null,
        createdAt: '2026-11-01T10:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 's2',
        dateLocal: '2026-11-08',
        templateId: null,
        plannedActivityId: null,
        title: 'A',
        status: 'completed',
        startedAt: '2026-11-08T10:00:00.000Z',
        completedAt: '2026-11-08T11:00:00.000Z',
        feelingRpe: null,
        feelingNote: null,
        createdAt: '2026-11-08T10:00:00.000Z',
        deletedAt: null,
      },
    ];
    const sets = [
      {
        id: 'a',
        sessionId: 's1',
        exerciseId: 'ex-curl',
        setIndex: 1,
        weightKg: 10,
        reps: 12,
        completed: true,
        completedAt: '2026-11-01T10:10:00.000Z',
        targetWeightKg: null,
        targetReps: null,
        createdAt: '2026-11-01T10:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'b',
        sessionId: 's2',
        exerciseId: 'ex-curl',
        setIndex: 1,
        weightKg: 12,
        reps: 10,
        completed: true,
        completedAt: '2026-11-08T10:10:00.000Z',
        targetWeightKg: null,
        targetReps: null,
        createdAt: '2026-11-08T10:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'c',
        sessionId: 's2',
        exerciseId: 'ex-curl',
        setIndex: 2,
        weightKg: null,
        reps: null,
        completed: false,
        completedAt: null,
        targetWeightKg: null,
        targetReps: null,
        createdAt: '2026-11-08T10:00:00.000Z',
        deletedAt: null,
      },
    ];
    const prev = previousCompletedSetsForExercise({
      exerciseId: 'ex-curl',
      sessions,
      sets,
    });
    assert.equal(prev.length, 1);
    assert.equal(prev[0].weightKg, 12);
    assert.equal(workingWeightFromSets(sets.filter((s) => s.sessionId === 's2')), 12);
    assert.equal(workingWeightFromSets([{ weightKg: null, reps: 8, completed: true }]), null);
  });

  it('export/import round-trips strength arrays; parse accepts v19 rejects v20', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    repo.addPlannedActivity({
      dateLocal: '2026-11-11',
      kind: 'cardio',
      title: 'Вело',
      cardioMinutes: 40,
    });
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-11',
      title: 'Верх B',
      templateId: 'tmpl-upper-b',
    });
    const set = repo.listWorkoutSets(session.id)[0];
    repo.completeWorkoutSet(set.id, { weightKg: 20, reps: 12 });
    repo.completeWorkoutSession(session.id);

    const json = repo.exportAll();
    const parsed = parseExportJson(json);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.snapshot.version, 19);
    assert.ok(parsed.snapshot.workoutSessions.length >= 1);

    repo.deleteAllUserData();
    assert.equal(repo.listWorkoutSessionsForDate('2026-11-11').length, 0);
    // Catalog re-seeded after wipe
    assert.ok(repo.listWorkoutTemplates().some((t) => t.id === 'tmpl-upper-a'));

    const summary = repo.importAll(json);
    assert.equal(summary.version, 19);
    const restored = repo.listWorkoutSessionsForDate('2026-11-11');
    assert.equal(restored.length, 1);
    assert.equal(restored[0].status, 'completed');
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-11').length, 1);

    const base = {
      version: 19,
      profile: { id: 'x', timezone: 'UTC', locale: 'ru', units: 'metric' },
      products: [],
      recipes: [],
      entries: [],
      ingredients: [],
    };
    assert.equal(parseExportJson(JSON.stringify(base)).ok, true);
    assert.equal(parseExportJson(JSON.stringify({ ...base, version: 18 })).ok, true);
    assert.equal(parseExportJson(JSON.stringify({ ...base, version: 20 })).ok, false);
  });

  it('seed materializers are deterministic for dogfood ids', () => {
    const exercises = materializeSeedExercises();
    const { templates, lines } = materializeSeedTemplates();
    assert.ok(exercises.every((e) => e.id.startsWith('ex-')));
    assert.equal(templates.length, 4);
    assert.ok(lines.every((l) => templates.some((t) => t.id === l.templateId)));
  });
});
