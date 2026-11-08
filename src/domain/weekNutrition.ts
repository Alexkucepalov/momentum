import { datesInWeekFromStart, weekStartMonday } from './habitWeek';

export type WeekDayNutrition = {
  dateLocal: string;
  /** Monday=0 .. Sunday=6 */
  weekdayIndex: number;
  energyKcal: number | null;
  entryCount: number;
  /** Ratio vs target when both known; null if no target or unknown energy. */
  vsTarget: number | null;
};

/**
 * Calendar week Mon→Sun that contains `endDateLocal` (any day in that week).
 * Name kept for call-site compatibility; not a rolling “last 7 days” window.
 */
export function buildWeekNutrition(args: {
  endDateLocal: string;
  targetKcal: number | null;
  totalsForDate: (dateLocal: string) => { energyKcal: number | null; entryCount: number };
}): WeekDayNutrition[] {
  const start = weekStartMonday(args.endDateLocal);
  const dates = datesInWeekFromStart(start);
  return dates.map((dateLocal, weekdayIndex) => {
    const totals = args.totalsForDate(dateLocal);
    const vsTarget =
      args.targetKcal != null && args.targetKcal > 0 && totals.energyKcal != null
        ? totals.energyKcal / args.targetKcal
        : null;
    return {
      dateLocal,
      weekdayIndex,
      energyKcal: totals.energyKcal,
      entryCount: totals.entryCount,
      vsTarget,
    };
  });
}

/**
 * Average of known daily kcal for days that have diary entries.
 * Empty days (`entryCount === 0`) are excluded even when `energyKcal` is 0
 * (repository totals use 0 for “no entries”, which must not become «ср. 0»).
 */
export function averageKnownKcal(days: WeekDayNutrition[]): number | null {
  const known = days
    .filter((d) => d.entryCount > 0 && d.energyKcal != null)
    .map((d) => d.energyKcal as number);
  if (known.length === 0) return null;
  return known.reduce((s, n) => s + n, 0) / known.length;
}

/** Count of week days that contribute to {@link averageKnownKcal}. */
export function loggedDaysForAverage(days: WeekDayNutrition[]): number {
  return days.filter((d) => d.entryCount > 0 && d.energyKcal != null).length;
}
