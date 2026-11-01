import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { runGarminSync } from './garminSyncService';
import { getGarminApiKey } from './secureKeyStore';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';

const MIN_INTERVAL_MS = 15 * 60 * 1000;

export type GarminAutoSyncStatus = {
  running: boolean;
  lastNote: string | null;
};

/**
 * Incremental Garmin sync on cold start and when app returns to foreground,
 * at most once per 15 minutes. Never invents data; shows soft status only.
 */
export function useGarminAutoSync(
  repo: FoodRepository,
  refresh: () => void,
): GarminAutoSyncStatus {
  const [running, setRunning] = useState(false);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const lastAttemptRef = useRef(0);
  const inFlightRef = useRef(false);

  const tick = useCallback(async () => {
    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - lastAttemptRef.current < MIN_INTERVAL_MS) return;
    const key = await getGarminApiKey();
    if (!key) return;

    inFlightRef.current = true;
    lastAttemptRef.current = now;
    setRunning(true);
    try {
      const result = await runGarminSync(repo, { mode: 'incremental' });
      refresh();
      if (!result.ok) {
        setLastNote(result.error ?? 'Garmin sync не удался');
        return;
      }
      const parts = [
        result.workoutsUpserted > 0 ? `тр. ${result.workoutsUpserted}` : null,
        result.stepsUpserted > 0 ? `шаги ${result.stepsUpserted}` : null,
        result.sleepUpserted > 0 ? `сон ${result.sleepUpserted}` : null,
        result.weightsUpserted > 0 ? `вес ${result.weightsUpserted}` : null,
      ].filter(Boolean);
      setLastNote(
        parts.length > 0
          ? `Garmin обновлён · ${parts.join(' · ')}`
          : 'Garmin: новых записей нет',
      );
    } catch (e) {
      setLastNote(e instanceof Error ? e.message : 'Garmin sync ошибка');
    } finally {
      inFlightRef.current = false;
      setRunning(false);
    }
  }, [repo, refresh]);

  useEffect(() => {
    void tick();
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void tick();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [tick]);

  return { running, lastNote };
}
