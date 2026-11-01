/** Inclusive calendar-day ranges. Garmin rejects many stats calls beyond ~28 days. */

function parseUtc(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function formatUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addUtcDays(isoDate: string, days: number): string {
  const dt = parseUtc(isoDate);
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatUtc(dt);
}

/**
 * Split [startDate, endDate] into inclusive chunks of at most `maxDays` days
 * (e.g. maxDays=28 → at most 28 calendar days per chunk).
 */
export function chunkInclusiveDateRange(
  startDate: string,
  endDate: string,
  maxDays: number,
): Array<{ startDate: string; endDate: string }> {
  if (maxDays < 1) throw new Error('maxDays must be >= 1');
  if (startDate > endDate) return [];
  const out: Array<{ startDate: string; endDate: string }> = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    const chunkEnd = addUtcDays(cursor, maxDays - 1);
    const end = chunkEnd < endDate ? chunkEnd : endDate;
    out.push({ startDate: cursor, endDate: end });
    cursor = addUtcDays(end, 1);
  }
  return out;
}
