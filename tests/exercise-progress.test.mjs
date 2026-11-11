import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { exerciseWorkingWeightSeries } = mods['domain/strength/exerciseProgress'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('exerciseWorkingWeightSeries', () => {
  it('skips sessions without completed sets and keeps null weight', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const s1 = repo.startWorkoutSession({
      dateLocal: '2026-11-01',
      title: 'A',
      templateId: 'tmpl-upper-a',
    });
    const set1 = repo.listWorkoutSets(s1.id).find((s) => s.exerciseId === 'ex-chest-press');
    assert.ok(set1);
    repo.completeWorkoutSet(set1.id, { weightKg: 40, reps: 10 });
    repo.completeWorkoutSession(s1.id);

    const s2 = repo.startWorkoutSession({
      dateLocal: '2026-11-08',
      title: 'A',
      templateId: 'tmpl-upper-a',
    });
    // abandon without completing chest press sets
    repo.abandonWorkoutSession(s2.id);

    const s3 = repo.startWorkoutSession({
      dateLocal: '2026-11-10',
      title: 'A',
      templateId: 'tmpl-upper-a',
    });
    const set3 = repo.listWorkoutSets(s3.id).find((s) => s.exerciseId === 'ex-chest-press');
    repo.completeWorkoutSet(set3.id, { weightKg: null, reps: 12 });
    repo.completeWorkoutSession(s3.id);

    const snap = repo.toSnapshot();
    const series = exerciseWorkingWeightSeries({
      exerciseId: 'ex-chest-press',
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
    });
    assert.equal(series.length, 2);
    assert.equal(series[0].workingWeightKg, 40);
    assert.equal(series[1].workingWeightKg, null);
    assert.equal(series[1].topReps, 12);
  });
});
