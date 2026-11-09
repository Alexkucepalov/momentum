import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import {
  formatTodayWidgetDisplay,
  widgetEnergyFromTotals,
  type TodayWidgetPayload,
} from '../../../../src/widgets/todayWidgetContract';
import type { FoodRepository } from '../../../../src/storage/foodRepository';
import { localDateKey } from '../../../../src/storage/validation';

const FILE_NAME = 'nf_fit_today_widget.json';

type NfFitWidgetsNative = {
  writePayloadAndRefresh?: (json: string) => Promise<boolean>;
  refresh?: () => Promise<boolean>;
};

function widgetsNative(): NfFitWidgetsNative | null {
  const mod = NativeModules.NfFitWidgets as NfFitWidgetsNative | undefined;
  return mod ?? null;
}

function widgetFileUri(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) return null;
  return `${base}${FILE_NAME}`;
}

function buildWidgetBody(repo: FoodRepository): string {
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
    energyTargetKcal: profile.dailyEnergyKcal,
    waterTargetMl: profile.waterTargetMl,
  };
  const display = formatTodayWidgetDisplay(payload);
  return JSON.stringify({
    ...payload,
    ...display,
    waterUnit: payload.waterMl != null && payload.waterMl >= 1000 ? 'L' : 'ml',
    updatedAt: new Date().toISOString(),
  });
}

/** Remove widget JSON after full local wipe (best-effort). */
export async function clearTodayWidgetPayload(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const uri = widgetFileUri();
    if (!uri) return;
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
    const native = widgetsNative();
    if (native?.refresh) await native.refresh();
  } catch {
    // Best-effort — never block wipe UX.
  }
}

/**
 * Persist today metrics for Android AppWidgets and refresh home tiles immediately.
 */
export async function syncTodayWidgetPayload(repo: FoodRepository): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const body = buildWidgetBody(repo);
    const native = widgetsNative();
    if (native?.writePayloadAndRefresh) {
      await native.writePayloadAndRefresh(body);
      return;
    }
    const uri = widgetFileUri();
    if (!uri) return;
    await FileSystem.writeAsStringAsync(uri, body);
    if (native?.refresh) await native.refresh();
  } catch {
    // Widget file is best-effort — never block diary.
  }
}
