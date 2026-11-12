import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('strength template editor API', () => {
  it('creates custom exercise and adds it via setTemplateExercises', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const created = repo.createStrengthExercise({
      name: 'Жим гантелей лёжа',
      primaryMuscles: ['chest'],
      equipment: 'гантели',
    });
    assert.equal(created.name, 'Жим гантелей лёжа');
    assert.equal(created.primaryMuscles[0], 'chest');

    const tmpl = repo.createWorkoutTemplate({
      name: 'Мой верх',
      exercises: [
        {
          exerciseId: created.id,
          targetSets: 2,
          targetRepsMin: 8,
          targetRepsMax: 12,
          restSec: 90,
        },
      ],
    });
    const lines = repo.listTemplateExercises(tmpl.id);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].exerciseId, created.id);
    assert.equal(lines[0].targetSets, 2);
  });

  it('reorderTemplateExercise swaps adjacent lines without touching sessions', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const linesBefore = repo.listTemplateExercises('tmpl-upper-a');
    assert.ok(linesBefore.length >= 2);
    const firstId = linesBefore[0].id;
    const secondId = linesBefore[1].id;

    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-12',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    const setIds = repo.listWorkoutSets(session.id).map((s) => s.id);

    const after = repo.reorderTemplateExercise('tmpl-upper-a', firstId, 'down');
    assert.equal(after[0].id, secondId);
    assert.equal(after[1].id, firstId);
    assert.deepEqual(
      after.map((l) => l.sortOrder),
      after.map((_, i) => i),
    );

    // Session history unchanged
    assert.deepEqual(
      repo.listWorkoutSets(session.id).map((s) => s.id),
      setIds,
    );
  });

  it('syncBuiltinStrengthProgram does not overwrite user-edited template lines', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const custom = repo.createStrengthExercise({ name: 'Кастом' });
    repo.setTemplateExercises('tmpl-upper-a', [
      {
        exerciseId: custom.id,
        targetSets: 3,
        targetRepsMin: 5,
        targetRepsMax: 5,
        restSec: 120,
      },
    ]);
    repo.updateWorkoutTemplate('tmpl-upper-a', { name: 'Верх мой' });

    repo.ensureStrengthCatalog();

    assert.equal(repo.getWorkoutTemplate('tmpl-upper-a').name, 'Верх мой');
    const lines = repo.listTemplateExercises('tmpl-upper-a');
    assert.equal(lines.length, 1);
    assert.equal(lines[0].exerciseId, custom.id);
    assert.equal(lines[0].targetSets, 3);
  });

  it('reorderPlannedActivity moves cards within the same day', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const a = repo.addPlannedActivity({
      dateLocal: '2026-11-12',
      kind: 'strength',
      title: 'A',
      templateId: 'tmpl-upper-a',
      sortOrder: 0,
    });
    const b = repo.addPlannedActivity({
      dateLocal: '2026-11-12',
      kind: 'cardio',
      title: 'B',
      cardioMinutes: 30,
      sortOrder: 1,
    });
    const ordered = repo.reorderPlannedActivity(b.id, 'up');
    assert.equal(ordered[0].id, b.id);
    assert.equal(ordered[1].id, a.id);
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-13').length, 0);
  });

  it('rejects empty exercise name and soft-deleted exercises in templates', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    assert.throws(() => repo.createStrengthExercise({ name: '  ' }));
    const ex = repo.createStrengthExercise({ name: 'Временное' });
    repo.softDeleteStrengthExercise(ex.id);
    assert.equal(repo.getStrengthExercise(ex.id), null);
    assert.throws(() =>
      repo.setTemplateExercises('tmpl-upper-a', [
        { exerciseId: ex.id, targetSets: 2 },
      ]),
    );
  });
});
