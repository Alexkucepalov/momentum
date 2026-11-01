import type { WorkoutType } from '../../storage/types';

/** Mapped weight ready for repository upsert — null fields stay null (unknown ≠ 0). */
export type MappedGarminWeight = {
  kg: number;
  weighedAt: string;
  externalId: string;
};

export type MappedGarminHrZone = {
  zone: number;
  secs: number;
};

export type MappedGarminWorkout = {
  dateLocal: string;
  type: WorkoutType;
  durationSec: number;
  distanceM: number | null;
  notes: string | null;
  externalId: string;
  /** Numeric Garmin activityId for detail fetch. */
  activityId: string;
  calories: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPowerW: number | null;
  maxPowerW: number | null;
  normalizedPowerW: number | null;
  avgCadence: number | null;
  elevationGainM: number | null;
  avgSpeedMps: number | null;
  maxSpeedMps: number | null;
  movingDurationSec: number | null;
  hrZones: MappedGarminHrZone[] | null;
  /** Flat key/value pairs for detail UI (no secrets). */
  detailFields: Record<string, string | number | boolean | null>;
  polyline: import('./mapPolyline').MappedGarminPolyline | null;
  charts: import('./mapChart').MappedGarminCharts | null;
};

export type MappedGarminSteps = {
  dateLocal: string;
  steps: number | null;
  distanceM: number | null;
  activeKcal: number | null;
  externalId: string;
};

/** One Garmin sleep night — null means unknown, never invent 0. */
export type MappedGarminSleep = {
  dateLocal: string;
  sleepSec: number | null;
  deepSec: number | null;
  lightSec: number | null;
  remSec: number | null;
  awakeSec: number | null;
  startAt: string | null;
  endAt: string | null;
  avgSpo2: number | null;
  avgRespiration: number | null;
  sleepScore: number | null;
  externalId: string;
};

export type SyncWindow = {
  startDate: string;
  endDate: string;
  /** True when using the deep initial / full backfill. */
  isInitial: boolean;
};
