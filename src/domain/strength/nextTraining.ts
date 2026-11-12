import type { PlannedActivity, WorkoutSession } from './types';

export type NextTrainingTarget =
  | { kind: 'draft'; session: WorkoutSession }
  | { kind: 'planned'; activity: PlannedActivity; isToday: boolean }
  | { kind: 'empty' };

/** Pick draft → today planned → next upcoming in week. */
export function resolveNextTrainingTarget(args: {
  inProgress: WorkoutSession[];
  todayDate: string;
  weekActivities: PlannedActivity[];
}): NextTrainingTarget {
  const draft = args.inProgress[0];
  if (draft) return { kind: 'draft', session: draft };

  const sorted = [...args.weekActivities].sort((a, b) => {
    const d = a.dateLocal.localeCompare(b.dateLocal);
    if (d !== 0) return d;
    return (a.timeLocal ?? '').localeCompare(b.timeLocal ?? '') || a.sortOrder - b.sortOrder;
  });

  const today = sorted.find((a) => a.dateLocal === args.todayDate);
  if (today) return { kind: 'planned', activity: today, isToday: true };

  const upcoming = sorted.find((a) => a.dateLocal > args.todayDate);
  if (upcoming) return { kind: 'planned', activity: upcoming, isToday: false };

  return { kind: 'empty' };
}
