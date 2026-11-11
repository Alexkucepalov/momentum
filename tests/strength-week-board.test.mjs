import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { buildStrengthWeekDays } = mods['domain/strength/weekBoard'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

describe('strength week board', () => {
  it('groups by day and keeps empty days empty', () => {
    const weekDates = [
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ];
    const activities = [
      {
        id: 'a1',
        dateLocal: '2026-11-10',
        timeLocal: null,
        kind: 'strength',
        title: 'Верх A',
        subtitle: null,
        templateId: 'tmpl-upper-a',
        cardioMinutes: null,
        sortOrder: 0,
        createdAt: '2026-11-01T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'a2',
        dateLocal: '2026-11-10',
        timeLocal: null,
        kind: 'rest',
        title: 'Отдых',
        subtitle: null,
        templateId: null,
        cardioMinutes: null,
        sortOrder: 1,
        createdAt: '2026-11-01T00:00:00.000Z',
        deletedAt: null,
      },
    ];
    const days = buildStrengthWeekDays({ weekDates, activities });
    assert.equal(days.length, 7);
    assert.equal(days[0].activities.length, 0);
    assert.equal(days[1].activities.length, 2);
    assert.equal(days[1].activities[0].title, 'Верх A');
  });

  it('move then copy via repo leaves history intact', () => {
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
    repo.completeWorkoutSession(session.id);
    repo.movePlannedActivity(planned.id, { dateLocal: '2026-11-12' });
    repo.copyPlannedActivity(planned.id, { dateLocal: '2026-11-14' });
    assert.equal(repo.getWorkoutSession(session.id)?.dateLocal, '2026-11-10');
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-12').length, 1);
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-14').length, 1);
    assert.equal(repo.listPlannedActivitiesForDate('2026-11-10').length, 0);
  });
});
