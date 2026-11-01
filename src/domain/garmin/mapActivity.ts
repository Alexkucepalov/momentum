import type { WorkoutType } from '../../storage/types';
import { mapGarminChartSeries } from './mapChart';
import { mapGarminPolyline } from './mapPolyline';
import type { MappedGarminHrZone, MappedGarminWorkout } from './types';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function nonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

function finiteNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

function nonNegNumber(v: unknown): number | null {
  const n = finiteNumber(v);
  if (n == null || n < 0) return null;
  return n;
}

/** Map Garmin activityType.typeKey / typeId strings to Momentum WorkoutType. */
export function mapGarminActivityType(raw: unknown): WorkoutType {
  const key =
    nonEmptyString(raw) ??
    nonEmptyString(asRecord(raw)?.typeKey) ??
    nonEmptyString(asRecord(raw)?.typeId) ??
    '';
  const k = key.toLowerCase();
  if (!k) return 'other';
  if (k.includes('cycl') || k.includes('bike') || k === 'road_biking' || k === 'indoor_cycling') {
    return 'cycling';
  }
  if (
    k.includes('strength') ||
    k.includes('weight') ||
    k.includes('gym') ||
    k === 'strength_training' ||
    k === 'indoor_cardio'
  ) {
    return 'strength';
  }
  if (
    k.includes('walk') ||
    k.includes('hik') ||
    k.includes('run') ||
    k.includes('jog') ||
    k === 'trail_running'
  ) {
    return 'walking';
  }
  if (k.includes('football') || k.includes('soccer')) return 'football';
  return 'other';
}

function parseDateLocal(raw: unknown): string | null {
  const s = nonEmptyString(raw);
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1]! : null;
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = nonNegNumber(row[k]);
    if (n != null) return n;
  }
  return null;
}

function mapHrZones(raw: unknown): MappedGarminHrZone[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: MappedGarminHrZone[] = [];
  for (let i = 0; i < raw.length; i++) {
    const z = asRecord(raw[i]);
    if (!z) continue;
    const secs =
      nonNegNumber(z.secsInZone) ??
      nonNegNumber(z.secs) ??
      nonNegNumber(z.timeInZone) ??
      nonNegNumber(z.duration);
    if (secs == null) continue;
    const zone = finiteNumber(z.zoneNumber) ?? finiteNumber(z.zone) ?? i + 1;
    out.push({ zone: Math.round(zone), secs: Math.round(secs) });
  }
  return out.length > 0 ? out : null;
}

function flattenDetailFields(row: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const skip = new Set([
    'activityType',
    'activityTypeDTO',
    'eventType',
    'privacy',
    'userPro',
    'ownerId',
    'ownerDisplayName',
    'ownerFullName',
    'ownerProfileImageUrlSmall',
    'ownerProfileImageUrlMedium',
    'ownerProfileImageUrlLarge',
  ]);
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(row)) {
    if (skip.has(k)) continue;
    if (v == null) {
      out[k] = null;
      continue;
    }
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
      continue;
    }
    if (Array.isArray(v) && v.every((x) => typeof x === 'number' || typeof x === 'string')) {
      out[k] = v.join(', ');
    }
  }
  return out;
}

/**
 * Map one Garmin activity search or detail row.
 * Duration missing → skip (cannot invent).
 */
export function mapGarminActivityItem(raw: unknown): MappedGarminWorkout | null {
  const row = asRecord(raw);
  if (!row) return null;

  // Detail endpoint nests summary under summaryDTO sometimes.
  const summary = asRecord(row.summaryDTO) ?? row;

  const idNum =
    finiteNumber(row.activityId) ??
    finiteNumber(summary.activityId) ??
    finiteNumber(row.activityIdOwner);
  const idStr =
    nonEmptyString(row.activityId) ??
    nonEmptyString(summary.activityId) ??
    (idNum != null ? String(Math.trunc(idNum)) : null);
  if (!idStr) return null;

  const dateLocal =
    parseDateLocal(row.startTimeLocal) ??
    parseDateLocal(summary.startTimeLocal) ??
    parseDateLocal(row.startTimeGMT) ??
    parseDateLocal(summary.startTimeGMT) ??
    parseDateLocal(row.calendarDate);
  if (!dateLocal) return null;

  const durationSec =
    finiteNumber(row.duration) ??
    finiteNumber(summary.duration) ??
    finiteNumber(row.elapsedDuration) ??
    finiteNumber(summary.elapsedDuration);
  if (durationSec == null || durationSec <= 0) return null;

  const distanceRaw =
    finiteNumber(row.distance) ?? finiteNumber(summary.distance) ?? finiteNumber(row.distanceInMeters);
  const distanceM = distanceRaw == null ? null : distanceRaw < 0 ? null : distanceRaw;

  const name =
    nonEmptyString(row.activityName) ??
    nonEmptyString(summary.activityName) ??
    nonEmptyString(row.name);
  const type = mapGarminActivityType(
    row.activityType ?? row.activityTypeDTO ?? summary.activityType ?? summary.activityTypeDTO,
  );

  const calories = pickNumber(summary, ['calories', 'activeCalories', 'bmrCalories']);
  const avgHeartRate = pickNumber(summary, ['averageHR', 'avgHR', 'avgHeartRate']);
  const maxHeartRate = pickNumber(summary, ['maxHR', 'maxHeartRate']);
  const avgPowerW = pickNumber(summary, ['avgPower', 'averagePower']);
  const maxPowerW = pickNumber(summary, ['maxPower']);
  const normalizedPowerW = pickNumber(summary, ['normPower', 'normalizedPower']);
  const avgCadence = pickNumber(summary, ['averageRunningCadenceInStepsPerMinute', 'avgBikeCadence', 'averageBikeCadence', 'avgCadence']);
  const elevationGainM = pickNumber(summary, ['elevationGain', 'elevationGainInMeters']);
  const avgSpeedMps = pickNumber(summary, ['averageSpeed', 'avgSpeed']);
  const maxSpeedMps = pickNumber(summary, ['maxSpeed']);
  const movingDurationSec = pickNumber(summary, ['movingDuration', 'movingDurationInSeconds']);
  const hrZones =
    mapHrZones(row.heartRateZones) ??
    mapHrZones(summary.heartRateZones) ??
    mapHrZones(row.hrZones);

  return {
    dateLocal,
    type,
    durationSec: Math.round(durationSec),
    distanceM,
    notes: name,
    externalId: `garmin-activity:${idStr}`,
    activityId: idStr,
    calories,
    avgHeartRate,
    maxHeartRate,
    avgPowerW,
    maxPowerW,
    normalizedPowerW,
    avgCadence,
    elevationGainM,
    avgSpeedMps,
    maxSpeedMps,
    movingDurationSec,
    hrZones,
    detailFields: flattenDetailFields({ ...summary, ...row }),
    polyline: mapGarminPolyline(row) ?? mapGarminPolyline(summary),
    charts: mapGarminChartSeries(row),
  };
}

export function mapGarminActivitiesResponse(payload: unknown): MappedGarminWorkout[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord(payload)?.activities)
      ? (asRecord(payload)!.activities as unknown[])
      : [];
  const out: MappedGarminWorkout[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const mapped = mapGarminActivityItem(item);
    if (!mapped) continue;
    if (seen.has(mapped.externalId)) continue;
    seen.add(mapped.externalId);
    out.push(mapped);
  }
  return out;
}

/** Merge list-row with detail payload (detail wins for metrics). */
export function mergeGarminActivityDetail(
  base: MappedGarminWorkout,
  detailRaw: unknown,
): MappedGarminWorkout {
  const detailed = mapGarminActivityItem(detailRaw);
  if (!detailed || detailed.externalId !== base.externalId) {
    return base;
  }
  return {
    ...base,
    ...detailed,
    notes: detailed.notes ?? base.notes,
    detailFields: { ...base.detailFields, ...detailed.detailFields },
    hrZones: detailed.hrZones ?? base.hrZones,
    polyline: detailed.polyline ?? base.polyline,
    charts: detailed.charts ?? base.charts,
  };
}
