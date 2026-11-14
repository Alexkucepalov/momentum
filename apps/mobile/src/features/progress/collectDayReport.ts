import { completedTrainingFacts } from '../../../../../src/domain/completedTraining';
import { buildDayReportText } from '../../../../../src/domain/dayReport';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../../src/storage/validation';

const WORKOUT_TYPE_RU: Record<string, string> = {
  cycling: 'вело',
  strength: 'силовая',
  walking: 'ходьба',
  football: 'футбол',
  other: 'другое',
};

/** Collect one-day plain-text report for ChatGPT paste. */
export function collectDayReportText(
  repo: FoodRepository,
  dateLocal: string,
  generatedAt: Date = new Date(),
): string {
  const profile = repo.getProfile();
  const totals = repo.dailyTotals(dateLocal);
  const sleep = repo.getSleepForDate(dateLocal);
  const workouts = completedTrainingFacts(repo.listWorkoutsForDate(dateLocal), repo.listWorkoutSessionsForDate(dateLocal));
  const steps = repo.getDailyActivityStats(dateLocal)?.steps ?? null;
  const weights = repo.listWeights(Number.MAX_SAFE_INTEGER);
  let weightKg: number | null = null;
  for (const w of weights) {
    if (localDateKey(new Date(w.weighedAt), profile.timezone) === dateLocal) {
      weightKg = w.kg;
      break;
    }
  }

  return buildDayReportText({
    dateLocal,
    generatedAtIso: generatedAt.toISOString(),
    nutrition: {
      entryCount: totals.entryCount,
      energyKcal: totals.energyKcal,
      proteinG: totals.proteinG,
      fatG: totals.fatG,
      carbG: totals.carbG,
      hasUnknownFields: totals.hasUnknownFields,
    },
    waterMl: repo.waterMlForDate(dateLocal),
    waterTargetMl: profile.waterTargetMl,
    activityMinutes: repo.activityMinutesForDate(dateLocal),
    steps,
    workouts: workouts.map((w) => ({
      type: `${WORKOUT_TYPE_RU[w.type] ?? w.type}${w.title ? ` · ${w.title} (время сессии)` : ''}`,
      durationMin: w.durationSec == null ? null : Math.round(w.durationSec / 60),
      calories: w.calories,
      notes: w.notes,
    })),
    weightKg,
    sleep: sleep
      ? {
          sleepSec: sleep.sleepSec,
          deepSec: sleep.deepSec,
          lightSec: sleep.lightSec,
          remSec: sleep.remSec,
          awakeSec: sleep.awakeSec,
          sleepScore: sleep.sleepScore,
          avgSpo2: sleep.avgSpo2,
        }
      : null,
    targets: {
      energyKcal: profile.dailyEnergyKcal,
      proteinG: profile.dailyProteinG,
      fatG: profile.dailyFatG,
      carbG: profile.dailyCarbG,
    },
  });
}
