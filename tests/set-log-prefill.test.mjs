import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { initialSetFieldValues, nextIncompleteSetId } = mods['domain/strength/setLogPrefill'];

describe('set log prefill', () => {
  it('prefers logged values, else targets; never invents 0', () => {
    assert.deepEqual(
      initialSetFieldValues({
        id: '1',
        sessionId: 's',
        exerciseId: 'e',
        setIndex: 1,
        weightKg: null,
        reps: null,
        completed: false,
        completedAt: null,
        targetWeightKg: 40,
        targetReps: 10,
        createdAt: '',
        deletedAt: null,
      }),
      { weight: '40', reps: '10' },
    );
    assert.deepEqual(
      initialSetFieldValues({
        id: '1',
        sessionId: 's',
        exerciseId: 'e',
        setIndex: 1,
        weightKg: 42,
        reps: null,
        completed: false,
        completedAt: null,
        targetWeightKg: 40,
        targetReps: 10,
        createdAt: '',
        deletedAt: null,
      }),
      { weight: '42', reps: '10' },
    );
    assert.deepEqual(
      initialSetFieldValues({
        id: '1',
        sessionId: 's',
        exerciseId: 'e',
        setIndex: 1,
        weightKg: null,
        reps: null,
        completed: false,
        completedAt: null,
        targetWeightKg: null,
        targetReps: null,
        createdAt: '',
        deletedAt: null,
      }),
      { weight: '', reps: '' },
    );
  });

  it('nextIncompleteSetId skips completed', () => {
    const id = nextIncompleteSetId([
      {
        id: 'a',
        sessionId: 's',
        exerciseId: 'e1',
        setIndex: 1,
        weightKg: 1,
        reps: 1,
        completed: true,
        completedAt: '',
        targetWeightKg: null,
        targetReps: null,
        createdAt: '',
        deletedAt: null,
      },
      {
        id: 'b',
        sessionId: 's',
        exerciseId: 'e1',
        setIndex: 2,
        weightKg: null,
        reps: null,
        completed: false,
        completedAt: null,
        targetWeightKg: null,
        targetReps: null,
        createdAt: '',
        deletedAt: null,
      },
    ]);
    assert.equal(id, 'b');
  });
});
