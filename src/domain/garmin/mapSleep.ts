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
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    if (typeof o.value === 'number' && Number.isFinite(o.value) && o.value >= 0) return o.value;
  }
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.trim().replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
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
  // Personal API: sleepScores.overall.value · Connect: overallScore / qualityScore
  return (
    nonNegNumber(nested.overall) ??
    nonNegNumber(nested.overallScore) ??
    nonNegNumber(nested.qualityScore) ??
    nonNegNumber(nested.quality) ??
    nonNegNumber(nested.totalScore)
  );
}

/** Sum durations from Garmin sleepLevelsMap segments when stage seconds are missing. */
function secondsFromLevelsMap(
  levels: unknown,
  key: string,
): number | null {
  const map = asRecord(levels);
  if (!map) return null;
  const segs = map[key];
  if (!Array.isArray(segs) || segs.length === 0) return null;
  let total = 0;
  let any = false;
  for (const seg of segs) {
    const r = asRecord(seg);
    if (!r) continue;
    const start =
      isoFromMsOrString(r.startGMT) ??
      isoFromMsOrString(r.startLocal) ??
      isoFromMsOrString(r.startTimeGMT);
    const end =
      isoFromMsOrString(r.endGMT) ??
      isoFromMsOrString(r.endLocal) ??
      isoFromMsOrString(r.endTimeGMT);
    if (!start || !end) continue;
    const ms = Date.parse(end) - Date.parse(start);
    if (!Number.isFinite(ms) || ms < 0) continue;
    total += ms / 1000;
    any = true;
  }
  return any ? total : null;
}

/**
 * Map one Garmin sleep summary row.
 * Missing stage/score fields stay null (unknown ≠ 0).
 */
export function mapGarminSleepItem(raw: unknown): MappedGarminSleep | null {
  const row = asRecord(raw);
  if (!row) return null;

  const nested =
    asRecord(row.dailySleepDTO) ??
    asRecord(row.sleepDTO) ??
    asRecord(row.dailySleep) ??
    row;

  const dateLocal =
    nonEmptyString(nested.calendarDate) ??
    nonEmptyString(nested.date) ??
    nonEmptyString(row.calendarDate) ??
    nonEmptyString(row.date);
  if (!dateLocal || !/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) return null;

  const levels = nested.sleepLevelsMap ?? row.sleepLevelsMap;

  let sleepSec =
    nonNegNumber(nested.sleepTimeSeconds) ??
    nonNegNumber(nested.sleepSeconds) ??
    nonNegNumber(nested.durationInSeconds) ??
    nonNegNumber(nested.totalSleepTimeInSeconds) ??
    nonNegNumber(nested.sleepTimeInSeconds);

  const deepSec =
    nonNegNumber(nested.deepSleepSeconds) ??
    nonNegNumber(nested.deepSleepTime) ??
    secondsFromLevelsMap(levels, 'deep');
  const lightSec =
    nonNegNumber(nested.lightSleepSeconds) ??
    nonNegNumber(nested.lightSleepTime) ??
    secondsFromLevelsMap(levels, 'light');
  const remSec =
    nonNegNumber(nested.remSleepSeconds) ??
    nonNegNumber(nested.remSleepTime) ??
    secondsFromLevelsMap(levels, 'rem');
  const awakeSec =
    nonNegNumber(nested.awakeSleepSeconds) ??
    nonNegNumber(nested.awakeDurationInSeconds) ??
    nonNegNumber(nested.awakeSleepTime) ??
    secondsFromLevelsMap(levels, 'awake');

  // Reconstruct overnight total from stages when total missing (exclude awake; do not invent naps).
  if (sleepSec == null) {
    const parts = [deepSec, lightSec, remSec].filter((n): n is number => n != null);
    if (parts.length > 0) sleepSec = parts.reduce((a, b) => a + b, 0);
  }

  const startAt =
    isoFromMsOrString(nested.sleepStartTimestampLocal) ??
    isoFromMsOrString(nested.sleepStartTimestampGMT) ??
    isoFromMsOrString(nested.sleepStartTimestamp) ??
    isoFromMsOrString(nested.startGMT);
  const endAt =
    isoFromMsOrString(nested.sleepEndTimestampLocal) ??
    isoFromMsOrString(nested.sleepEndTimestampGMT) ??
    isoFromMsOrString(nested.sleepEndTimestamp) ??
    isoFromMsOrString(nested.endGMT);

  const avgSpo2 =
    nonNegNumber(nested.averageSpO2Value) ??
    nonNegNumber(nested.avgSpO2) ??
    nonNegNumber(nested.averageSPO2Value) ??
    nonNegNumber(nested.avgSleepSpO2) ??
    nonNegNumber(asRecord(nested.averageSpO2)?.value);
  const avgRespiration =
    nonNegNumber(nested.averageRespirationValue) ??
    nonNegNumber(nested.avgRespiration) ??
    nonNegNumber(nested.averageRespiration) ??
    nonNegNumber(nested.avgSleepRespiration);

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

/** Flatten Garmin sleep payloads: arrays, wrappers, or date-keyed maps. */
export function flattenGarminSleepPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = asRecord(payload);
  if (!obj) return [];

  if (Array.isArray(obj.dailySleepList)) return obj.dailySleepList as unknown[];
  if (Array.isArray(obj.dailySleepDTOList)) return obj.dailySleepDTOList as unknown[];
  if (Array.isArray(obj.sleepList)) return obj.sleepList as unknown[];
  if (Array.isArray(obj.values)) return obj.values as unknown[];
  if (Array.isArray(obj.data)) return obj.data as unknown[];
  if (Array.isArray(obj.items)) return obj.items as unknown[];
  if (obj.dailySleepDTO || obj.sleepDTO || obj.calendarDate || obj.sleepTimeSeconds) {
    return [obj.dailySleepDTO ?? obj.sleepDTO ?? obj];
  }

  // Date-keyed map: { "2026-11-01": {…}, "2026-11-02": {…} }
  const dated: unknown[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const rec = asRecord(val);
    if (!rec) continue;
    if (!rec.calendarDate && !rec.date && !asRecord(rec.dailySleepDTO)?.calendarDate) {
      dated.push({ ...rec, calendarDate: key });
    } else {
      dated.push(rec);
    }
  }
  return dated;
}

export function mapGarminSleepResponse(payload: unknown): MappedGarminSleep[] {
  const list = flattenGarminSleepPayload(payload);
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
