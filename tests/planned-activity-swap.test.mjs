import assert from 'node:assert/strict';
import test from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const { createMemoryFoodRepository, asPersistable } = loadSrcModules()['storage/foodRepository'];

test('swapping a weekly plan persists both dates together and keeps completed history', async () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const first = repo.addPlannedActivity({ dateLocal: '2026-11-13', timeLocal: '18:00', kind: 'strength', title: 'Силовая', templateId: 'tmpl-upper-a', sortOrder: 0 });
  const second = repo.addPlannedActivity({ dateLocal: '2026-11-14', timeLocal: '10:00', kind: 'cardio', title: 'Вело', cardioMinutes: 60, sortOrder: 1 });
  const session = repo.startWorkoutSession({ dateLocal: first.dateLocal, title: first.title, templateId: first.templateId, plannedActivityId: first.id });
  repo.completeWorkoutSession(session.id);
  const history = repo.getWorkoutSession(session.id);
  const snapshots = [];
  asPersistable(repo).setPersistHook(snap => snapshots.push(structuredClone(snap)));

  repo.swapPlannedActivities(first.id, second.id);
  await Promise.resolve();
  assert.equal(snapshots.length, 1, 'a swap must issue one complete persistence notification');
  assert.equal(repo.listPlannedActivitiesForDate('2026-11-14')[0].id, first.id);
  assert.equal(repo.listPlannedActivitiesForDate('2026-11-13')[0].id, second.id);
  assert.equal(repo.listPlannedActivitiesForDate('2026-11-14')[0].timeLocal, '18:00');
  assert.deepEqual(repo.getWorkoutSession(session.id), history);
  const restored = createMemoryFoodRepository({ timezone: 'UTC', snapshot: snapshots[0] });
  assert.equal(restored.listPlannedActivitiesForDate('2026-11-14')[0].id, first.id);
  assert.equal(restored.listPlannedActivitiesForDate('2026-11-13')[0].id, second.id);
  assert.deepEqual(restored.getWorkoutSession(session.id), history);

  repo.swapPlannedActivities(first.id, second.id);
  assert.equal(repo.listPlannedActivitiesForDate('2026-11-13')[0].id, first.id, 'the same operation supports Undo');
});

test('a missing or deleted swap target cannot partially move the source', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const first = repo.addPlannedActivity({ dateLocal: '2026-11-13', kind: 'strength', title: 'Силовая' });
  const second = repo.addPlannedActivity({ dateLocal: '2026-11-14', kind: 'cardio', title: 'Вело' });
  repo.softDeletePlannedActivity(second.id);
  let writes = 0;
  asPersistable(repo).setPersistHook(() => writes++);
  assert.throws(() => repo.swapPlannedActivities(first.id, second.id), /not found/);
  assert.throws(() => repo.swapPlannedActivities(first.id, 'missing'), /not found/);
  assert.equal(repo.listPlannedActivitiesForDate(first.dateLocal)[0].id, first.id);
  assert.equal(writes, 0);
});
