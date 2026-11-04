import { shiftDateLocal } from './repeatMeal';

export type FoodLogStreak = {
  /** Consecutive days ending at `endDateLocal` with at least one diary entry. */
  current: number;
  /** True when `endDateLocal` itself has a log. */
  loggedEndDate: boolean;
};

/**
 * Gentle food-log streak: count back from endDate while each day has entries.
 * Missing day breaks the run — no shame copy; UI decides messaging.
 */
export function foodLogStreak(args: {
  endDateLocal: string;
  hasLog: (dateLocal: string) => boolean;
  /** Safety cap so we never scan forever. */
  maxDays?: number;
}): FoodLogStreak {
  const maxDays = args.maxDays ?? 365;
  const loggedEndDate = args.hasLog(args.endDateLocal);
  let current = 0;
  let cursor = args.endDateLocal;
  for (let i = 0; i < maxDays; i += 1) {
    if (!args.hasLog(cursor)) break;
    current += 1;
    cursor = shiftDateLocal(cursor, -1);
  }
  return { current, loggedEndDate };
}

/** Non-judgmental label for UI. */
export function formatFoodLogStreakRu(streak: FoodLogStreak): {
  title: string;
  body: string;
} {
  if (streak.current <= 0) {
    return {
      title: 'Серия дней с едой',
      body: 'Отметь приём — начнётся спокойный счётчик дней подряд.',
    };
  }
  if (streak.current === 1) {
    return {
      title: '1 день с записями',
      body: streak.loggedEndDate
        ? 'Хороший старт. Завтра можно продолжить — без давления.'
        : 'Вчера был лог. Сегодня ещё можно добавить приём.',
    };
  }
  const n = streak.current;
  const days =
    n % 10 === 1 && n % 100 !== 11
      ? 'день'
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 'дня'
        : 'дней';
  return {
    title: `${n} ${days} подряд`,
    body: streak.loggedEndDate
      ? 'Ты ведёшь дневник — этого достаточно. Пропуск — нормально.'
      : 'Серия ещё жива, если сегодня появится хотя бы одна запись.',
  };
}
