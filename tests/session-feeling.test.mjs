import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('session feeling RPE', () => {
  it('stores optional RPE/note; empty stays null not zero', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-16',
      title: 'Верх A',
      templateId: 'tmpl-upper-a',
    });
    assert.equal(session.feelingRpe, null);
    const done = repo.completeWorkoutSession(session.id, {
      feelingRpe: 7,
      feelingNote: 'поясница ок',
    });
    assert.equal(done.feelingRpe, 7);
    assert.equal(done.feelingNote, 'поясница ок');
    assert.throws(() =>
      repo.completeWorkoutSession(session.id, { feelingRpe: 0 }),
    );
  });

  it('complete without feeling leaves null', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    const session = repo.startWorkoutSession({
      dateLocal: '2026-11-17',
      title: 'Ноги + пресс',
      templateId: 'tmpl-legs',
    });
    const done = repo.completeWorkoutSession(session.id);
    assert.equal(done.feelingRpe, null);
    assert.equal(done.feelingNote, null);
  });
});
