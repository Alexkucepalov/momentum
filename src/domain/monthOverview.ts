/**
 * 30-day glance for Progress overview (Stage 8 / M1–M2).
 * Unknown metrics stay null — never coerced to 0 for averages.
 */

export type MonthOverviewDayInput = {
  dateLocal: string;
  foodEntryCount: number;
  energyKcal: number | null;
  activityMinutes: number;
  sleepSec: number | null;
};

export type MonthOverviewResult = {
  daysInWindow: number;
  foodDays: number;
  workoutMinutes: number;
  sleepKnownNights: number;
  /** Average sleep hours when ≥1 night known; null if none. */
  sleepAvgHours: number | null;
  /** Average known energy kcal/day among days with entryCount > 0 and energy known. */
  energyAvgKcal: number | null;
  weightDeltaKg: number | null;
};

function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

export function datesEndingOn(endDateLocal: string, count: number): string[] {
  const n = Math.max(1, Math.floor(count));
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    out.push(shiftDays(endDateLocal, -i));
  }
  return out;
}

export function buildMonthOverview(input: {
  days: MonthOverviewDayInput[];
  weightOldestKg: number | null;
  weightNewestKg: number | null;
}): MonthOverviewResult {
  const { days } = input;
  let foodDays = 0;
  let workoutMinutes = 0;
  let sleepKnownNights = 0;
  let sleepSecSum = 0;
  let energySum = 0;
  let energyKnownDays = 0;

  for (const d of days) {
    if (d.foodEntryCount > 0) foodDays += 1;
    workoutMinutes += Math.max(0, d.activityMinutes);
    if (d.sleepSec != null && Number.isFinite(d.sleepSec) && d.sleepSec >= 0) {
      sleepKnownNights += 1;
      sleepSecSum += d.sleepSec;
    }
    if (
      d.foodEntryCount > 0 &&
      d.energyKcal != null &&
      Number.isFinite(d.energyKcal)
    ) {
      energySum += d.energyKcal;
      energyKnownDays += 1;
    }
  }

  const sleepAvgHours =
    sleepKnownNights === 0 ? null : Math.round((sleepSecSum / sleepKnownNights / 3600) * 10) / 10;
  const energyAvgKcal =
    energyKnownDays === 0 ? null : Math.round(energySum / energyKnownDays);

  let weightDeltaKg: number | null = null;
  if (
    input.weightOldestKg != null &&
    input.weightNewestKg != null &&
    Number.isFinite(input.weightOldestKg) &&
    Number.isFinite(input.weightNewestKg)
  ) {
    weightDeltaKg = Math.round((input.weightNewestKg - input.weightOldestKg) * 10) / 10;
  }

  return {
    daysInWindow: days.length,
    foodDays,
    workoutMinutes,
    sleepKnownNights,
    sleepAvgHours,
    energyAvgKcal,
    weightDeltaKg,
  };
}
