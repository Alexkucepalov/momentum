/** Shared weekday / date labels for week strips across tabs. */

export const WEEKDAY_SHORT_RU = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'] as const;
export const WEEKDAY_SHORT_RU_CAP = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export function dayNumber(dateLocal: string): string {
  return String(Number(dateLocal.slice(8, 10)));
}

/** Monday=0 .. Sunday=6 for YYYY-MM-DD. */
export function mondayBasedIndex(dateLocal: string): number {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const sun0 = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (sun0 + 6) % 7;
}

export function formatWeekRangeRu(startLocal: string, endLocal: string): string {
  const start = formatDayMonthRu(startLocal);
  const end = formatDayMonthRu(endLocal);
  const sameMonth = startLocal.slice(0, 7) === endLocal.slice(0, 7);
  if (sameMonth) {
    return `${Number(startLocal.slice(8, 10))}–${end}`;
  }
  return `${start} – ${end}`;
}

function formatDayMonthRu(dateLocal: string): string {
  const [y, m, d] = dateLocal.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
