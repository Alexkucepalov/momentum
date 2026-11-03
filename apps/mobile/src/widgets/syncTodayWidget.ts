import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import {
  formatTodayWidgetDisplay,
  widgetEnergyFromTotals,
  type TodayWidgetPayload,
} from '../../../../src/widgets/todayWidgetContract';
import type { FoodRepository } from '../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../src/storage/validation';

const FILE_NAME = 'nf_fit_today_widget.json';

/**
 * Persist today metrics for Android AppWidgets (same app UID).
 * Shared JSON feeds Today / Compact / Movement providers.
 * Unknown kcal/steps/sleep stay null → widget shows «—».
 */
export async function syncTodayWidgetPayload(repo: FoodRepository): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const profile = repo.getProfile();
    const dateLocal = localDateKey(new Date(), profile.timezone);
    const totals = repo.dailyTotals(dateLocal);
    const waterMl = repo.waterMlForDate(dateLocal);
    const steps = repo.getDailyActivityStats(dateLocal)?.steps ?? null;
    const sleepSec = repo.getSleepForDate(dateLocal)?.sleepSec ?? null;
    const payload: TodayWidgetPayload = {
      dateLocal,
      energyKcal: widgetEnergyFromTotals(totals),
      waterMl: waterMl > 0 ? waterMl : null,
      streakDays: null,
      nextMealHint: null,
      steps,
      sleepSec,
    };
    const display = formatTodayWidgetDisplay(payload);
    const body = JSON.stringify({
      ...payload,
      ...display,
      updatedAt: new Date().toISOString(),
    });
    const base = FileSystem.documentDirectory;
    if (!base) return;
    await FileSystem.writeAsStringAsync(`${base}${FILE_NAME}`, body);
  } catch {
    // Widget file is best-effort — never block diary.
  }
}
