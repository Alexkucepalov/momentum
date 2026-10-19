/**
 * Month grid helpers (Monday-first) and day markers for the diary calendar.
 */

export type CalendarDayMarkers = {
  dateLocal: string;
  hasFood: boolean;
  hasActivity: boolean;
  hasWeight: boolean;
};

/** YYYY-MM-DD → { y, m0, d } */
export function parseDateLocal(iso: string): { y: number; m0: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m0: m - 1, d };
}

export function toDateLocal(y: number, m0: number, d: number): string {
  const dt = new Date(Date.UTC(y, m0, d));
  return dt.toISOString().slice(0, 10);
}

export function addMonths(iso: string, delta: number): string {
  const { y, m0, d } = parseDateLocal(iso);
  const dt = new Date(Date.UTC(y, m0 + delta, 1));
  const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, last);
  return toDateLocal(dt.getUTCFullYear(), dt.getUTCMonth(), day);
}

/**
 * Monday-first month cells. Leading/trailing nulls pad the grid to full weeks.
 */
export function buildMonthCells(year: number, monthIndex0: number): Array<string | null> {
  const first = new Date(Date.UTC(year, monthIndex0, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  // getUTCDay: 0=Sun … 6=Sat → Monday-first offset
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = [];
  for (let i = 0; i < mondayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toDateLocal(year, monthIndex0, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function monthTitleRu(year: number, monthIndex0: number): string {
  const dt = new Date(Date.UTC(year, monthIndex0, 1));
  const month = dt.toLocaleDateString('ru-RU', { month: 'long', timeZone: 'UTC' });
  const cap = month.charAt(0).toUpperCase() + month.slice(1);
  return `${cap} ${year}`;
}

/** Latest weight entry whose weighedAt falls on dateLocal in the given timezone. */
export function weightKgForDateLocal(
  weights: Array<{ weighedAt: string; kg: number }>,
  dateLocal: string,
  toLocalDate: (isoInstant: string) => string,
): number | null {
  const onDay = weights
    .filter((w) => toLocalDate(w.weighedAt) === dateLocal)
    .sort((a, b) => b.weighedAt.localeCompare(a.weighedAt));
  return onDay[0]?.kg ?? null;
}
