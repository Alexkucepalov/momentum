import { createSerialWidgetWrites } from "../../../../src/widgets/serialWidgetWrites";
import { NativeModules, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import {
  formatTodayWidgetDisplay,
  widgetEnergyFromTotals,
  type TodayWidgetPayload,
} from "../../../../src/widgets/todayWidgetContract";
import type { FoodRepository } from "../../../../src/storage/foodRepository";
import { localDateKey } from "../../../../src/storage/validation";

const FILE_NAME = "nf_fit_today_widget.json";
const writes = createSerialWidgetWrites();

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
    waterUnit: payload.waterMl != null && payload.waterMl >= 1000 ? "L" : "ml",
    updatedAt: new Date().toISOString(),
  });
}

/** Cleanup is serialized after previous writes and reports failure to the wipe screen. */
export async function clearTodayWidgetPayload(): Promise<void> {
  if (Platform.OS !== "android") return;
  await writes.run(async () => {
    const uri = widgetFileUri();
    if (!uri) throw new Error("Каталог виджета недоступен");
    await FileSystem.deleteAsync(uri, { idempotent: true });
    const native = widgetsNative();
    if (native?.refresh && !(await native.refresh()))
      throw new Error("Не удалось очистить отображение виджета");
  });
}

/**
 * Persist today metrics for Android AppWidgets and refresh home tiles immediately.
 */
export async function syncTodayWidgetPayload(
  repo: FoodRepository,
): Promise<void> {
  if (Platform.OS !== "android") return;
  await writes.run(async () => {
    try {
      // Read only when the queued job starts, after any intervening wipe/import.
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
      // Normal widget refresh must not block diary; explicit wipe reports errors separately.
    }
  });
}
