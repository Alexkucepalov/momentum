import {
  chartsToJson,
  computeSyncWindow,
  mapGarminActivitiesResponse,
  mapGarminDailySummariesForSteps,
  mapGarminSleepResponse,
  mapGarminStepsResponse,
  mapGarminWeightResponse,
  mergeGarminActivityDetail,
  polylineToJson,
  type MappedGarminWorkout,
} from '../../../../../src/domain/garmin';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../../src/storage/validation';
import { obtainGarminBearerToken, GarminAuthError } from './garminAuth';
import {
  fetchActivityDetailsBatched,
  fetchAllActivities,
  fetchDailySleepSummariesChunked,
  fetchDailyStepsChunked,
  fetchDailySummariesChunked,
  fetchWeightRangeChunked,
  GarminClientError,
} from './garminClient';
import { getLocalDataWipeEpoch } from '../../../../../src/domain/localDataWipeEpoch';
import { getGarminApiKey } from './secureKeyStore';

export type GarminSyncMode = 'full' | 'incremental';

export type GarminSyncResult = {
  ok: boolean;
  weightsUpserted: number;
  workoutsUpserted: number;
  stepsUpserted: number;
  sleepUpserted: number;
  windowStart: string | null;
  windowEnd: string | null;
  error: string | null;
  warnings: string[];
};

function errorMessage(e: unknown): string {
  if (e instanceof GarminAuthError || e instanceof GarminClientError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Неизвестная ошибка синхронизации';
}

async function settle<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: `${label}: ${errorMessage(e)}` };
  }
}

function detailJsonOf(w: MappedGarminWorkout): string | null {
  try {
    return JSON.stringify({
      fields: w.detailFields,
      hrZones: w.hrZones,
      activityId: w.activityId,
    });
  } catch {
    return null;
  }
}

/**
 * Pull Garmin Personal API data into the local repository.
 * Steps/weight are chunked (Garmin 28-day stats limit). Activities load deep history + details.
 */
export async function runGarminSync(
  repo: FoodRepository,
  opts?: { mode?: GarminSyncMode },
): Promise<GarminSyncResult> {
  const attemptAt = new Date().toISOString();
  const wipeEpochAtStart = getLocalDataWipeEpoch();
  repo.setGarminSyncState({ lastAttemptAt: attemptAt, lastError: null });

  const empty: GarminSyncResult = {
    ok: false,
    weightsUpserted: 0,
    workoutsUpserted: 0,
    stepsUpserted: 0,
    sleepUpserted: 0,
    windowStart: null,
    windowEnd: null,
    error: null,
    warnings: [],
  };

  const abortedByWipe = (): GarminSyncResult | null => {
    if (getLocalDataWipeEpoch() === wipeEpochAtStart) return null;
    const error = 'Синхронизация отменена: локальные данные очищены';
    return { ...empty, error };
  };

  try {
    const key = await getGarminApiKey();
    if (!key) {
      const error = 'Сначала сохрани Personal API Key';
      repo.setGarminSyncState({ lastError: error });
      return { ...empty, error };
    }
    const wipedEarly = abortedByWipe();
    if (wipedEarly) return wipedEarly;

    const profile = repo.getProfile();
    const todayLocal = localDateKey(new Date(), profile.timezone);
    const syncState = repo.getGarminSyncState();
    const mode = opts?.mode ?? (syncState.lastSyncedTo ? 'incremental' : 'full');
    const window = computeSyncWindow({
      todayLocal,
      lastSyncedTo: syncState.lastSyncedTo,
      mode,
    });

    const { accessToken } = await obtainGarminBearerToken({ forceRefresh: false });
    const warnings: string[] = [];
    let weightsUpserted = 0;
    let workoutsUpserted = 0;
    let stepsUpserted = 0;
    let sleepUpserted = 0;

    const weightRes = await settle('Вес', () =>
      fetchWeightRangeChunked(accessToken, window.startDate, window.endDate),
    );
    if (weightRes.ok) {
      const wiped = abortedByWipe();
      if (wiped) return wiped;
      warnings.push(...weightRes.value.warnings);
      const weights = weightRes.value.payloads.flatMap((p) => mapGarminWeightResponse(p));
      for (const w of weights) {
        const row = repo.upsertIntegratedWeight({
          kg: w.kg,
          weighedAt: w.weighedAt,
          source: 'garmin',
          externalId: w.externalId,
        });
        if (row) weightsUpserted += 1;
      }
      if (weights.length === 0) {
        warnings.push(
          'Вес: в Garmin Connect за окно нет измерений (весы Xiaomi/др. сюда не попадают)',
        );
      }
    } else {
      warnings.push(weightRes.error);
    }

    // Steps: chunked stats, then daily summaries fallback.
    let stepsMapped = 0;
    const stepsRes = await settle('Шаги', () =>
      fetchDailyStepsChunked(accessToken, window.startDate, window.endDate),
    );
    if (stepsRes.ok) {
      const wiped = abortedByWipe();
      if (wiped) return wiped;
      warnings.push(...stepsRes.value.warnings);
      const steps = mapGarminStepsResponse(stepsRes.value.payloads);
      for (const s of steps) {
        repo.upsertDailyActivityStats({
          dateLocal: s.dateLocal,
          steps: s.steps,
          distanceM: s.distanceM,
          activeKcal: s.activeKcal,
          source: 'garmin',
          externalId: s.externalId,
        });
        stepsUpserted += 1;
      }
      stepsMapped = steps.length;
    } else {
      warnings.push(stepsRes.error);
    }

    if (stepsMapped === 0) {
      const sumRes = await settle('Шаги (daily summaries)', () =>
        fetchDailySummariesChunked(accessToken, window.startDate, window.endDate),
      );
      if (sumRes.ok) {
        const wiped = abortedByWipe();
        if (wiped) return wiped;
        warnings.push(...sumRes.value.warnings);
        const steps = sumRes.value.payloads.flatMap((p) => mapGarminDailySummariesForSteps(p));
        for (const s of steps) {
          repo.upsertDailyActivityStats({
            dateLocal: s.dateLocal,
            steps: s.steps,
            distanceM: s.distanceM,
            activeKcal: s.activeKcal,
            source: 'garmin',
            externalId: s.externalId,
          });
          stepsUpserted += 1;
        }
        if (steps.length === 0) {
          warnings.push('Шаги: Garmin вернул пустые daily summaries за окно');
        }
      } else {
        warnings.push(sumRes.error);
      }
    }

    const sleepRes = await settle('Сон', () =>
      fetchDailySleepSummariesChunked(accessToken, window.startDate, window.endDate),
    );
    if (sleepRes.ok) {
      const wiped = abortedByWipe();
      if (wiped) return wiped;
      warnings.push(...sleepRes.value.warnings);
      const nights = sleepRes.value.payloads.flatMap((p) => mapGarminSleepResponse(p));
      for (const n of nights) {
        repo.upsertSleepNight({
          dateLocal: n.dateLocal,
          sleepSec: n.sleepSec,
          deepSec: n.deepSec,
          lightSec: n.lightSec,
          remSec: n.remSec,
          awakeSec: n.awakeSec,
          startAt: n.startAt,
          endAt: n.endAt,
          avgSpo2: n.avgSpo2,
          avgRespiration: n.avgRespiration,
          sleepScore: n.sleepScore,
          source: 'garmin',
          externalId: n.externalId,
        });
        sleepUpserted += 1;
      }
      if (nights.length === 0) {
        warnings.push('Сон: Garmin вернул пустые summaries за окно');
      }
    } else {
      warnings.push(sleepRes.error);
    }

    // Activities: full unbounded list on full sync; dated window on incremental.
    const activitiesRes = await settle('Тренировки', async () => {
      if (mode === 'full') {
        return fetchAllActivities(accessToken, { pageSize: 100, maxPages: 100 });
      }
      return fetchAllActivities(accessToken, {
        startDate: window.startDate,
        endDate: window.endDate,
        pageSize: 100,
        maxPages: 40,
      });
    });

    if (activitiesRes.ok) {
      const wiped = abortedByWipe();
      if (wiped) return wiped;
      let mapped = mapGarminActivitiesResponse(activitiesRes.value);
      const ids = mapped.map((m) => m.activityId);
      const details = await fetchActivityDetailsBatched(accessToken, ids, 3);
      mapped = mapped.map((m) => {
        const d = details.get(m.activityId);
        return d ? mergeGarminActivityDetail(m, d) : m;
      });

      for (const w of mapped) {
        const row = repo.upsertIntegratedWorkout({
          dateLocal: w.dateLocal,
          type: w.type,
          durationSec: w.durationSec,
          distanceM: w.distanceM,
          notes: w.notes,
          source: 'garmin',
          externalId: w.externalId,
          calories: w.calories,
          avgHeartRate: w.avgHeartRate,
          maxHeartRate: w.maxHeartRate,
          avgPowerW: w.avgPowerW,
          maxPowerW: w.maxPowerW,
          normalizedPowerW: w.normalizedPowerW,
          avgCadence: w.avgCadence,
          elevationGainM: w.elevationGainM,
          avgSpeedMps: w.avgSpeedMps,
          maxSpeedMps: w.maxSpeedMps,
          movingDurationSec: w.movingDurationSec,
          hrZones: w.hrZones,
          detailJson: detailJsonOf(w),
          polylineJson: polylineToJson(w.polyline),
          chartJson: chartsToJson(w.charts),
        });
        if (row) workoutsUpserted += 1;
      }
    } else {
      warnings.push(activitiesRes.error);
    }

    const wipedFinal = abortedByWipe();
    if (wipedFinal) return wipedFinal;

    const anyOk =
      weightRes.ok || stepsUpserted > 0 || sleepUpserted > 0 || activitiesRes.ok;
    if (!anyOk) {
      const error = warnings.join(' · ') || 'Все запросы к Garmin завершились ошибкой';
      repo.setGarminSyncState({ lastAttemptAt: attemptAt, lastError: error });
      return { ...empty, windowStart: window.startDate, windowEnd: window.endDate, error, warnings };
    }

    const doneAt = new Date().toISOString();
    const lastError = warnings.length > 0 ? warnings.join(' · ') : null;
    repo.setGarminSyncState({
      lastSuccessfulSyncAt: doneAt,
      lastAttemptAt: attemptAt,
      lastError,
      lastSyncedFrom: window.startDate,
      lastSyncedTo: window.endDate,
    });

    return {
      ok: true,
      weightsUpserted,
      workoutsUpserted,
      stepsUpserted,
      sleepUpserted,
      windowStart: window.startDate,
      windowEnd: window.endDate,
      error: null,
      warnings,
    };
  } catch (e) {
    const wiped = abortedByWipe();
    if (wiped) return wiped;
    const error = errorMessage(e);
    repo.setGarminSyncState({ lastAttemptAt: attemptAt, lastError: error });
    return { ...empty, error };
  }
}
