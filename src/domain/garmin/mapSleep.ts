import type { MappedGarminSleep } from './types';

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

function isoFromMsOrString(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
    return new Date(v).toISOString();
  }
  if (typeof v === 'string' && v.trim()) {
    const t = Date.parse(v.trim());
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return null;
}

function scoreFrom(row: Record<string, unknown>): number | null {
  const direct =
    nonNegNumber(row.sleepScore) ??
    nonNegNumber(row.overallSleepScore) ??
    nonNegNumber(row.qualityScore);
  if (direct != null) return Math.round(direct);
  const nested = asRecord(row.sleepScores) ?? asRecord(row.scores);
  if (!nested) return null;
  return (
    nonNegNumber(nested.overallScore) ??
    nonNegNumber(nested.qualityScore) ??
    nonNegNumber(nested.totalScore)
  );
}

/**
 * Map one Garmin sleep summary row.
 * Missing stage/score fields stay null (unknown ≠ 0).
 */
export function mapGarminSleepItem(raw: unknown): MappedGarminSleep | null {
  const row = asRecord(raw);
  if (!row) return null;

  const nested = asRecord(row.dailySleepDTO) ?? asRecord(row.sleepDTO) ?? row;

  const dateLocal =
    nonEmptyString(nested.calendarDate) ??
    nonEmptyString(nested.date) ??
    nonEmptyString(row.calendarDate) ??
    nonEmptyString(row.date);
  if (!dateLocal || !/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) return null;

  const sleepSec =
    nonNegNumber(nested.sleepTimeSeconds) ??
    nonNegNumber(nested.sleepSeconds) ??
    nonNegNumber(nested.durationInSeconds);
  const deepSec = nonNegNumber(nested.deepSleepSeconds);
  const lightSec = nonNegNumber(nested.lightSleepSeconds);
  const remSec = nonNegNumber(nested.remSleepSeconds);
  const awakeSec =
    nonNegNumber(nested.awakeSleepSeconds) ?? nonNegNumber(nested.awakeDurationInSeconds);

  const startAt =
    isoFromMsOrString(nested.sleepStartTimestampLocal) ??
    isoFromMsOrString(nested.sleepStartTimestampGMT) ??
    isoFromMsOrString(nested.sleepStartTimestamp);
  const endAt =
    isoFromMsOrString(nested.sleepEndTimestampLocal) ??
    isoFromMsOrString(nested.sleepEndTimestampGMT) ??
    isoFromMsOrString(nested.sleepEndTimestamp);

  const avgSpo2 =
    nonNegNumber(nested.averageSpO2Value) ??
    nonNegNumber(nested.avgSpO2) ??
    nonNegNumber(nested.averageSPO2Value);
  const avgRespiration =
    nonNegNumber(nested.averageRespirationValue) ??
    nonNegNumber(nested.avgRespiration) ??
    nonNegNumber(nested.averageRespiration);

  const sleepScore = scoreFrom(nested) ?? scoreFrom(row);

  if (
    sleepSec == null &&
    deepSec == null &&
    lightSec == null &&
    remSec == null &&
    awakeSec == null &&
    sleepScore == null
  ) {
    return null;
  }

  return {
    dateLocal,
    sleepSec,
    deepSec,
    lightSec,
    remSec,
    awakeSec,
    startAt,
    endAt,
    avgSpo2,
    avgRespiration,
    sleepScore: sleepScore == null ? null : Math.round(sleepScore),
    externalId: `garmin-sleep:${dateLocal}`,
  };
}

export function mapGarminSleepResponse(payload: unknown): MappedGarminSleep[] {
  const obj = asRecord(payload);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(obj?.dailySleepList)
      ? (obj!.dailySleepList as unknown[])
      : Array.isArray(obj?.sleepList)
        ? (obj!.sleepList as unknown[])
        : Array.isArray(obj?.values)
          ? (obj!.values as unknown[])
          : Array.isArray(obj?.data)
            ? (obj!.data as unknown[])
            : obj?.dailySleepDTO
              ? [obj.dailySleepDTO]
              : [];

  const out: MappedGarminSleep[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const mapped = mapGarminSleepItem(item);
    if (!mapped) continue;
    if (seen.has(mapped.externalId)) continue;
    seen.add(mapped.externalId);
    out.push(mapped);
  }
  return out;
}
