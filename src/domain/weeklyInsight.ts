import { weekStartMonday, datesInWeekFromStart } from './habitWeek';

export type WeeklyInsightInput = {
  endDateLocal: string;
  foodDaysLogged: number;
  entryCount: number;
  energyKcalSum: number | null;
  energyHasUnknown: boolean;
  activityMinutes: number;
  workoutsCount: number;
  /** Habits that reached their weekly target. */
  habitsMetGoal: number;
  /** Habits that have a weekly target. */
  habitCount: number;
  challengesActive: number;
  challengesCompleted: number;
};

export type WeeklyInsight = {
  weekStart: string;
  weekEnd: string;
  lines: string[];
};

/**
 * Neutral weekly summary — observational, no shame language.
 * Unknown energy stays unknown (null ≠ 0).
 */
export function buildWeeklyInsight(input: WeeklyInsightInput): WeeklyInsight {
  const weekStart = weekStartMonday(input.endDateLocal);
  const days = datesInWeekFromStart(weekStart);
  const weekEnd = days[6] ?? input.endDateLocal;
  const lines: string[] = [];

  lines.push(
    input.foodDaysLogged > 0
      ? `Еда: записи в ${input.foodDaysLogged} из 7 дней · ${input.entryCount} позиций`
      : 'Еда: на этой неделе пока без записей',
  );

  if (input.foodDaysLogged === 0) {
    lines.push('Ккал за неделю: нет записей питания');
  } else if (input.energyHasUnknown || input.energyKcalSum == null) {
    lines.push('Ккал за неделю: часть значений неизвестна — сумма не считается');
  } else {
    lines.push(`Ккал за неделю (сумма дней с записями): ${Math.round(input.energyKcalSum)}`);
  }

  lines.push(
    input.workoutsCount > 0
      ? `Активность: ${input.workoutsCount} тренировок · ${input.activityMinutes} мин`
      : 'Активность: тренировок на этой неделе нет',
  );

  if (input.habitCount > 0) {
    lines.push(
      `Привычки: ${input.habitsMetGoal} из ${input.habitCount} достигли недельной цели`,
    );
  } else {
    lines.push('Привычки: целей на неделю пока нет');
  }

  if (input.challengesActive + input.challengesCompleted > 0) {
    lines.push(
      `Челленджи: активных ${input.challengesActive}, завершённых ${input.challengesCompleted}`,
    );
  }

  return { weekStart, weekEnd, lines };
}

/** Collect weekly insight numbers from repository-shaped callbacks. */
export function collectWeeklyInsightStats(args: {
  endDateLocal: string;
  dailyTotals: (dateLocal: string) => {
    energyKcal: number | null;
    entryCount: number;
    hasUnknownFields: boolean;
  };
  activityMinutesForDate: (dateLocal: string) => number;
  workoutsForDate: (dateLocal: string) => number;
  habitWeekStats: () => Array<{ completed: number; target: number }>;
  challenges: () => Array<{ status: string }>;
}): WeeklyInsight {
  const weekStart = weekStartMonday(args.endDateLocal);
  const days = datesInWeekFromStart(weekStart);
  let foodDaysLogged = 0;
  let entryCount = 0;
  let energyKcalSum: number | null = 0;
  let energyHasUnknown = false;
  let activityMinutes = 0;
  let workoutsCount = 0;

  for (const day of days) {
    const t = args.dailyTotals(day);
    if (t.entryCount > 0) foodDaysLogged += 1;
    entryCount += t.entryCount;
    // Empty days must not contribute a known 0 kcal to the week sum.
    if (t.entryCount === 0) {
      // skip energy
    } else if (t.hasUnknownFields || t.energyKcal == null) {
      energyHasUnknown = true;
      energyKcalSum = null;
    } else if (energyKcalSum != null) {
      energyKcalSum += t.energyKcal;
    }
    activityMinutes += args.activityMinutesForDate(day);
    workoutsCount += args.workoutsForDate(day);
  }

  const habitStats = args.habitWeekStats();
  const habitCount = habitStats.filter((h) => h.target > 0).length;
  const habitsMetGoal = habitStats.filter(
    (h) => h.target > 0 && h.completed >= h.target,
  ).length;
  const challenges = args.challenges();
  const challengesActive = challenges.filter((c) => c.status === 'active').length;
  const challengesCompleted = challenges.filter((c) => c.status === 'completed').length;

  return buildWeeklyInsight({
    endDateLocal: args.endDateLocal,
    foodDaysLogged,
    entryCount,
    energyKcalSum: foodDaysLogged === 0 ? null : energyKcalSum,
    energyHasUnknown: foodDaysLogged === 0 ? false : energyHasUnknown,
    activityMinutes,
    workoutsCount,
    habitsMetGoal,
    habitCount,
    challengesActive,
    challengesCompleted,
  });
}
