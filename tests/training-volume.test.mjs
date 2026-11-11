import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  sessionVolumes,
  personalRecordsByExercise,
  weekStrengthSummary,
} = mods['domain/strength/trainingVolume'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('training volume + PRs', () => {
  it('tonnage ignores unknown weight; PR takes heaviest then reps', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const s1 = repo.startWorkoutSession({
      dateLocal: '2026-11-16',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    const chest = repo.listWorkoutSets(s1.id).filter((s) => s.exerciseId === 'ex-chest-press');
    repo.completeWorkoutSet(chest[0].id, { weightKg: 40, reps: 10 });
    repo.completeWorkoutSet(chest[1].id, { weightKg: null, reps: 10 });
    repo.completeWorkoutSession(s1.id);

    const s2 = repo.startWorkoutSession({
      dateLocal: '2026-11-18',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    const chest2 = repo.listWorkoutSets(s2.id).filter((s) => s.exerciseId === 'ex-chest-press');
    repo.completeWorkoutSet(chest2[0].id, { weightKg: 42, reps: 8 });
    repo.completeWorkoutSet(chest2[1].id, { weightKg: 42, reps: 9 });
    repo.completeWorkoutSession(s2.id);

    const snap = repo.toSnapshot();
    const vols = sessionVolumes({ sessions: snap.workoutSessions, sets: snap.workoutSets });
    assert.equal(vols.length, 2);
    assert.equal(vols[0].tonnageKg, 400);
    assert.equal(vols[0].incomplete, true);
    assert.equal(vols[1].tonnageKg, 42 * 8 + 42 * 9);

    const prs = personalRecordsByExercise({
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
    });
    const pr = prs.get('ex-chest-press');
    assert.ok(pr);
    assert.equal(pr.weightKg, 42);
    assert.equal(pr.reps, 9);
  });

  it('week summary counts completed sessions vs planned strength', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    repo.applyStrengthProgramWeek('2026-11-16');
    const plannedStrength = repo
      .listPlannedActivitiesInWeek('2026-11-16')
      .filter((a) => a.kind === 'strength').length;
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-16',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    repo.completeWorkoutSession(session.id);
    const snap = repo.toSnapshot();
    const weekDates = [
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ];
    const summary = weekStrengthSummary({
      weekStart: '2026-11-16',
      weekDates,
      plannedStrengthCount: plannedStrength,
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
    });
    assert.equal(summary.plannedStrength, 4);
    assert.equal(summary.completedSessions, 1);
    assert.equal(summary.tonnageKg, null);
  });
});
