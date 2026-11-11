import type { PlannedActivity } from './types';

export type StrengthWeekDay = {
  dateLocal: string;
  weekdayIndex: number;
  activities: PlannedActivity[];
};

/** Group planned activities into Mon–Sun columns (empty days stay empty — not zero). */
export function buildStrengthWeekDays(args: {
  weekDates: string[];
  activities: PlannedActivity[];
}): StrengthWeekDay[] {
  return args.weekDates.map((dateLocal, weekdayIndex) => ({
    dateLocal,
    weekdayIndex,
    activities: args.activities
      .filter((a) => a.deletedAt == null && a.dateLocal === dateLocal)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
  }));
}
