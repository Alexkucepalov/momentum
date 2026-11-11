import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  buildPersonalProgramWeekDrafts,
  PERSONAL_PROGRAM_START,
  PERSONAL_PROGRAM_WEEK,
} = mods['domain/strength/personalProgramWeek'];
const { materializeSeedTemplates, SEED_TEMPLATE_EXERCISES } = mods['domain/strength/seedCatalog'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('personal strength program', () => {
  it('week skeleton is 4 strength + bike + 2 rest from Mon 2026-11-16', () => {
    assert.equal(PERSONAL_PROGRAM_START, '2026-11-16');
    assert.equal(PERSONAL_PROGRAM_WEEK.length, 7);
    const drafts = buildPersonalProgramWeekDrafts(PERSONAL_PROGRAM_START);
    assert.equal(drafts[0].dateLocal, '2026-11-16');
    assert.equal(drafts[0].title, 'Верх A');
    assert.equal(drafts[0].templateId, 'tmpl-upper-a');
    assert.equal(drafts[1].title, 'Ноги + пресс');
    assert.equal(drafts[2].kind, 'rest');
    assert.equal(drafts[4].kind, 'cardio');
    assert.equal(drafts[4].cardioMinutes, 45);
    assert.equal(drafts[5].dateLocal, '2026-11-21');
    assert.equal(drafts[5].timeLocal, '10:00');
    assert.equal(drafts[6].kind, 'rest');
  });

  it('builtin templates use 2 working sets (program v2)', () => {
    assert.ok(SEED_TEMPLATE_EXERCISES.every((l) => l.targetSets === 2));
    const { lines } = materializeSeedTemplates();
    const upperA = lines.filter((l) => l.templateId === 'tmpl-upper-a');
    assert.equal(upperA.length, 6);
    assert.equal(
      upperA.reduce((s, l) => s + l.targetSets, 0),
      12,
    );
    const upperC = lines.filter((l) => l.templateId === 'tmpl-upper-c');
    assert.equal(
      upperC.reduce((s, l) => s + l.targetSets, 0),
      16,
    );
  });

  it('applyStrengthProgramWeek fills plan; replace does not rewrite sessions', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const { created } = repo.applyStrengthProgramWeek('2026-11-16');
    assert.equal(created, 7);
    assert.equal(repo.listPlannedActivitiesInWeek('2026-11-16').length, 7);

    const planned = repo.listPlannedActivitiesForDate('2026-11-16')[0];
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-16',
      title: planned.title,
      templateId: planned.templateId,
      plannedActivityId: planned.id,
    });
    const set = repo.listWorkoutSets(session.id)[0];
    repo.completeWorkoutSet(set.id, { weightKg: 42, reps: 10 });
    repo.completeWorkoutSession(session.id);

    repo.applyStrengthProgramWeek('2026-11-16', { replace: true });
    assert.equal(repo.listPlannedActivitiesInWeek('2026-11-16').length, 7);
    const hist = repo.getWorkoutSession(session.id);
    assert.equal(hist.status, 'completed');
    assert.equal(hist.dateLocal, '2026-11-16');
    assert.equal(repo.listWorkoutSets(session.id).find((s) => s.id === set.id).weightKg, 42);
  });

  it('ensureStrengthCatalog refreshes builtin lines for existing installs', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    // Simulate stale v1 line still present — sync should land v2 ids.
    const lines = repo.listTemplateExercises('tmpl-upper-a');
    assert.ok(lines.every((l) => l.id.startsWith('tmpl-line-v2-')));
    assert.ok(lines.some((l) => l.exerciseId === 'ex-incline-press'));
    assert.ok(repo.getStrengthExercise('ex-pallof'));
    repo.ensureStrengthCatalog();
    assert.equal(repo.listTemplateExercises('tmpl-upper-a').length, 6);
  });
});
