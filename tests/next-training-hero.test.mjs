import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { resolveNextTrainingTarget } = mods['domain/strength/nextTraining'];
const { buildStrengthWeekDays } = mods['domain/strength/weekBoard'];

describe('next training hero resolution', () => {
  const baseSession = {
    id: 's1',
    dateLocal: '2026-11-12',
    templateId: null,
    plannedActivityId: null,
    title: 'Черновик',
    status: 'in_progress',
    startedAt: '2026-11-12T10:00:00.000Z',
    completedAt: null,
    feelingRpe: null,
    feelingNote: null,
    createdAt: '2026-11-12T10:00:00.000Z',
    deletedAt: null,
  };

  const act = (over) => ({
    id: 'a1',
    dateLocal: '2026-11-12',
    timeLocal: '19:30',
    kind: 'strength',
    title: 'Верх A',
    subtitle: null,
    templateId: 'tmpl-upper-a',
    cardioMinutes: null,
    sortOrder: 0,
    createdAt: '2026-11-12T00:00:00.000Z',
    deletedAt: null,
    ...over,
  });

  it('prefers in-progress draft over plan', () => {
    const t = resolveNextTrainingTarget({
      inProgress: [baseSession],
      todayDate: '2026-11-12',
      weekActivities: [act()],
    });
    assert.equal(t.kind, 'draft');
    assert.equal(t.session.id, 's1');
  });

  it('picks today plan then upcoming', () => {
    const today = resolveNextTrainingTarget({
      inProgress: [],
      todayDate: '2026-11-12',
      weekActivities: [act({ id: 'today' }), act({ id: 'later', dateLocal: '2026-11-14' })],
    });
    assert.equal(today.kind, 'planned');
    assert.equal(today.isToday, true);
    assert.equal(today.activity.id, 'today');

    const next = resolveNextTrainingTarget({
      inProgress: [],
      todayDate: '2026-11-13',
      weekActivities: [act({ id: 'later', dateLocal: '2026-11-14' })],
    });
    assert.equal(next.kind, 'planned');
    assert.equal(next.isToday, false);
    assert.equal(next.activity.id, 'later');
  });

  it('empty when no draft and no upcoming', () => {
    const t = resolveNextTrainingTarget({
      inProgress: [],
      todayDate: '2026-11-20',
      weekActivities: [act({ dateLocal: '2026-11-10' })],
    });
    assert.equal(t.kind, 'empty');
  });

  it('full week board still has 7 day slots', () => {
    const weekDates = [
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ];
    const days = buildStrengthWeekDays({
      weekDates,
      activities: [act({ dateLocal: '2026-11-16' })],
    });
    assert.equal(days.length, 7);
    assert.equal(days[0].activities.length, 1);
  });
});
