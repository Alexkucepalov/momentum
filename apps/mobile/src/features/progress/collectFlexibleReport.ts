import { completedTrainingFacts } from '../../../../../src/domain/completedTraining';
import {
  datesInInclusiveRange,
  type FlexibleReportInput,
  type ReportCategory,
  type ReportHabitRow,
  type ReportWorkoutRow,
  type ReportWeightRow,
} from '../../../../../src/domain/flexibleReport';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../../src/storage/validation';

const WORKOUT_TYPE_RU: Record<string, string> = {
  cycling: 'вело',
  strength: 'силовая',
  walking: 'ходьба',
  football: 'футбол',
  other: 'другое',
};

/**
 * Gather local repo data for the selected period/categories.
 * Pure aggregation — no invented nutrition values.
 */
export function collectFlexibleReportInput(
  repo: FoodRepository,
  args: {
    periodStart: string;
    periodEnd: string;
    categories: ReportCategory[];
    generatedAt?: Date;
  },
): FlexibleReportInput {
  const days = datesInInclusiveRange(args.periodStart, args.periodEnd);
  const profile = repo.getProfile();
  const generatedAt = args.generatedAt ?? new Date();
  const cats = new Set(args.categories);

  const nutritionDays = cats.has('nutrition')
    ? days.map((dateLocal) => {
        const t = repo.dailyTotals(dateLocal);
        return {
          dateLocal,
          entryCount: t.entryCount,
          energyKcal: t.energyKcal,
          proteinG: t.proteinG,
          fatG: t.fatG,
          carbG: t.carbG,
          hasUnknownFields: t.hasUnknownFields,
        };
      })
    : [];

  const workouts: ReportWorkoutRow[] = [];
  const stepsDays: FlexibleReportInput['stepsDays'] = [];
  if (cats.has('activity')) {
    for (const dateLocal of days) {
      for (const w of completedTrainingFacts(repo.listWorkoutsForDate(dateLocal), repo.listWorkoutSessionsForDate(dateLocal))) {
        workouts.push({
          dateLocal,
          type: `${WORKOUT_TYPE_RU[w.type] ?? w.type}${w.title ? ` · ${w.title} (время сессии)` : ''}`,
          durationMin: w.durationSec == null ? null : Math.round(w.durationSec / 60),
          distanceM: w.distanceM,
          notes: w.notes,
        });
      }
      const stats = repo.getDailyActivityStats(dateLocal);
      if (stats && (stats.steps != null || stats.distanceM != null)) {
        stepsDays.push({
          dateLocal,
          steps: stats.steps,
          distanceM: stats.distanceM,
        });
      }
    }
  }

  const weights: ReportWeightRow[] = [];
  if (cats.has('weight')) {
    for (const w of repo.listWeights(Number.MAX_SAFE_INTEGER)) {
      const d = localDateKey(new Date(w.weighedAt), profile.timezone);
      if (d >= args.periodStart && d <= args.periodEnd) {
        weights.push({ dateLocal: d, kg: w.kg });
      }
    }
    weights.sort((a, b) => a.dateLocal.localeCompare(b.dateLocal));
  }

  const habits: ReportHabitRow[] = [];
  if (cats.has('habits')) {
    for (const h of repo.listFlexibleHabits()) {
      let completions = 0;
      for (const dateLocal of days) {
        completions += repo.flexibleHabitDayValue(h.id, dateLocal);
      }
      habits.push({
        name: h.name,
        kind: h.kind === 'quantity' ? 'количество' : 'дни',
        completionsInRange: completions,
        unit: h.kind === 'quantity' ? h.unit : null,
      });
    }
  }

  return {
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    categories: args.categories,
    generatedAtIso: generatedAt.toISOString(),
    profile: {
      timezone: profile.timezone,
      heightCm: profile.heightCm,
      waterTargetMl: profile.waterTargetMl,
      dailyEnergyKcal: profile.dailyEnergyKcal,
      dailyProteinG: profile.dailyProteinG,
      dailyFatG: profile.dailyFatG,
      dailyCarbG: profile.dailyCarbG,
    },
    latestWeightKg: repo.latestWeight()?.kg ?? null,
    nutritionDays,
    workouts,
    stepsDays,
    weights,
    habits,
  };
}
