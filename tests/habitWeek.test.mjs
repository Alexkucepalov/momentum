import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadSrcModules } from './loadTsModules.mjs';

const {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
  habitWeekProgressRatio,
} = loadSrcModules()['domain/habitWeek'];

describe('habitWeek', () => {
  it('builds Mon–Sun marks with today and logs', () => {
    // 2026-10-18 is Sunday
    const marks = buildHabitWeekMarks({
      dateLocal: '2026-10-18',
      isLogged: (d) => d === '2026-10-13' || d === '2026-10-18',
    });
    assert.equal(marks.length, 7);
    assert.equal(marks[0].dateLocal, '2026-10-12');
    assert.equal(marks[0].label, 'Пн');
    assert.equal(marks[6].dateLocal, '2026-10-18');
    assert.equal(marks[6].isToday, true);
    assert.equal(marks[1].logged, true); // Tue 13
    assert.equal(marks[6].logged, true);
    assert.equal(marks[0].logged, false);
  });

  it('progress ratio stays in 0..1 and treats bad target as 0', () => {
    assert.equal(habitWeekProgressRatio(0, 3), 0);
    assert.equal(habitWeekProgressRatio(2, 4), 0.5);
    assert.equal(habitWeekProgressRatio(5, 3), 1);
    assert.equal(habitWeekProgressRatio(2, 0), 0);
  });

  it('formats week label without shame language', () => {
    assert.equal(formatHabitWeekLabel(1, 3), '1 из 3 на этой неделе');
    assert.equal(formatHabitWeekLabel(3, 3), '3 из 3 · неделя ок');
    assert.match(formatHabitWeekLabel(1, 3), /из/);
    assert.doesNotMatch(formatHabitWeekLabel(0, 3), /провал|штраф|streak|серия/i);
  });
});
