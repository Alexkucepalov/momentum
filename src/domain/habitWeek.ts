/** Short RU weekday labels Monday→Sunday. */
export const HABIT_WEEKDAY_LABELS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

/** Monday-based week start (YYYY-MM-DD). Kept local to avoid domain→storage import. */
export function weekStartMonday(dateLocal: string): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

export function datesInWeekFromStart(weekStart: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const [y, m, d] = weekStart.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

export type HabitWeekDayMark = {
  dateLocal: string;
  label: string;
  logged: boolean;
  isToday: boolean;
};

/**
 * Neutral week marks for a habit (no streak, no shame for empty days).
 * `isLogged` is injected so domain stays free of repository.
 */
export function buildHabitWeekMarks(args: {
  dateLocal: string;
  isLogged: (day: string) => boolean;
}): HabitWeekDayMark[] {
  const weekStart = weekStartMonday(args.dateLocal);
  return datesInWeekFromStart(weekStart).map((day, i) => ({
    dateLocal: day,
    label: HABIT_WEEKDAY_LABELS_RU[i] ?? '',
    logged: args.isLogged(day),
    isToday: day === args.dateLocal,
  }));
}

/** Ratio 0..1 for a calm progress bar; unknown/zero target → 0. */
export function habitWeekProgressRatio(completed: number, target: number): number {
  if (!Number.isFinite(completed) || !Number.isFinite(target) || target <= 0) return 0;
  if (completed <= 0) return 0;
  return Math.min(1, completed / target);
}

export function formatHabitWeekLabel(
  completed: number,
  target: number,
  unit?: string | null,
): string {
  const c = Number.isFinite(completed) ? Math.max(0, Math.round(completed * 10) / 10) : 0;
  const t = Number.isFinite(target) && target > 0 ? Math.round(target * 10) / 10 : 0;
  const u = unit?.trim() ? ` ${unit.trim()}` : '';
  if (t <= 0) return `${c}${u} за неделю`;
  if (c >= t) return `${c} из ${t}${u} · неделя ок`;
  return `${c} из ${t}${u} на этой неделе`;
}
