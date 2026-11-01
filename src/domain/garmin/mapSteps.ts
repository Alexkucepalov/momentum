import type { MappedGarminSteps } from './types';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function nonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function nonNegNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null;
  return v;
}

/** Map one daily steps stats row. Missing steps → null (not 0). */
export function mapGarminStepsItem(raw: unknown): MappedGarminSteps | null {
  const row = asRecord(raw);
  if (!row) return null;
  const dateLocal =
    nonEmptyString(row.calendarDate) ??
    nonEmptyString(row.date) ??
    nonEmptyString(row.summaryDate);
  if (!dateLocal || !/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) return null;

  const steps =
    row.totalSteps === undefined || row.totalSteps === null
      ? row.steps === undefined || row.steps === null
        ? null
        : nonNegNumber(row.steps)
      : nonNegNumber(row.totalSteps);
  const distanceM =
    row.totalDistance === undefined || row.totalDistance === null
      ? row.distanceInMeters === undefined || row.distanceInMeters === null
        ? null
        : nonNegNumber(row.distanceInMeters)
      : nonNegNumber(row.totalDistance);
  const activeKcal =
    row.activeKilocalories === undefined || row.activeKilocalories === null
      ? row.totalKilocalories === undefined || row.totalKilocalories === null
        ? row.calories === undefined || row.calories === null
          ? null
          : nonNegNumber(row.calories)
        : nonNegNumber(row.totalKilocalories)
      : nonNegNumber(row.activeKilocalories);

  if (steps == null && distanceM == null && activeKcal == null) return null;

  return {
    dateLocal,
    steps,
    distanceM,
    activeKcal,
    externalId: `garmin-steps:${dateLocal}`,
  };
}

export function mapGarminStepsResponse(payload: unknown): MappedGarminSteps[] {
  const obj = asRecord(payload);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(obj?.values)
      ? (obj!.values as unknown[])
      : Array.isArray(obj?.dailyValues)
        ? (obj!.dailyValues as unknown[])
        : Array.isArray(obj?.data)
          ? (obj!.data as unknown[])
          : [];
  const out: MappedGarminSteps[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const mapped = mapGarminStepsItem(item);
    if (!mapped) continue;
    if (seen.has(mapped.externalId)) continue;
    seen.add(mapped.externalId);
    out.push(mapped);
  }
  return out;
}

/** Daily summaries v2 often include totalSteps — use as steps fallback. */
export function mapGarminDailySummariesForSteps(payload: unknown): MappedGarminSteps[] {
  const obj = asRecord(payload);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(obj?.dailySummaries)
      ? (obj!.dailySummaries as unknown[])
      : Array.isArray(obj?.data)
        ? (obj!.data as unknown[])
        : [];
  return mapGarminStepsResponse(list);
}
