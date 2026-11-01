import type { MappedGarminWeight } from './types';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function positiveNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

function nonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

/**
 * Garmin weight payloads usually list grams in `weight` (e.g. 76400) and ms epoch in `date`.
 * Accept only concrete values; never invent kg.
 */
export function mapGarminWeightItem(raw: unknown): MappedGarminWeight | null {
  const row = asRecord(raw);
  if (!row) return null;

  const externalId =
    nonEmptyString(row.samplePk) ??
    (typeof row.samplePk === 'number' && Number.isFinite(row.samplePk)
      ? String(row.samplePk)
      : null) ??
    nonEmptyString(row.id) ??
    (typeof row.id === 'number' && Number.isFinite(row.id) ? String(row.id) : null);
  if (!externalId) return null;

  const weightG = positiveNumber(row.weight);
  const weightKgDirect = positiveNumber(row.weightInKg) ?? positiveNumber(row.kg);
  let kg: number | null = null;
  if (weightKgDirect != null) {
    kg = weightKgDirect;
  } else if (weightG != null) {
    // Garmin stores body weight in grams when > ~200 (otherwise already kg).
    kg = weightG > 200 ? weightG / 1000 : weightG;
  }
  if (kg == null || kg < 20 || kg > 400) return null;

  let weighedAt: string | null = null;
  if (typeof row.date === 'number' && Number.isFinite(row.date) && row.date > 0) {
    weighedAt = new Date(row.date).toISOString();
  } else {
    const datetime = nonEmptyString(row.datetime);
    if (datetime) {
      const d = new Date(datetime);
      if (!Number.isNaN(d.getTime())) weighedAt = d.toISOString();
    } else {
      const calendarDate = nonEmptyString(row.calendarDate);
      if (calendarDate) {
        const d = new Date(`${calendarDate}T12:00:00.000Z`);
        if (!Number.isNaN(d.getTime())) weighedAt = d.toISOString();
      }
    }
  }
  if (!weighedAt) return null;

  return { kg, weighedAt, externalId: `garmin-weight:${externalId}` };
}

/** Extract weight items from Garmin range response (object with dateWeightList or bare array). */
export function mapGarminWeightResponse(payload: unknown): MappedGarminWeight[] {
  const out: MappedGarminWeight[] = [];
  const seen = new Set<string>();
  let list: unknown[] = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else {
    const obj = asRecord(payload);
    const nested = obj?.dateWeightList ?? obj?.weightList ?? obj?.dateWeight;
    if (Array.isArray(nested)) list = nested;
  }
  for (const item of list) {
    const mapped = mapGarminWeightItem(item);
    if (!mapped) continue;
    if (seen.has(mapped.externalId)) continue;
    seen.add(mapped.externalId);
    out.push(mapped);
  }
  return out;
}
