/**
 * Read-only Android home-widget payload for nf-fit day metrics.
 * Unknown nutrients stay null — never coerce to 0 for display.
 * Native: `apps/mobile/plugins/withNfFitWidgets.js` (Today / Compact / Movement).
 */

import { formatMetricValue } from '../design-system/metricFormat';

export type TodayWidgetPayload = {
  dateLocal: string;
  /** Food diary energy for the day; null if empty or has unknown macros. */
  energyKcal: number | null;
  waterMl: number | null;
  /** Daily steps from Garmin; null = unknown ≠ 0. */
  steps?: number | null;
  /** Sleep duration seconds; null = unknown. */
  sleepSec?: number | null;
  /** Consecutive logging days; null if not computed. */
  streakDays: number | null;
  /** Optional next meal hint — never invents nutrition. */
  nextMealHint: string | null;
};

export type TodayWidgetDisplay = {
  dateLocal: string;
  energyLabel: string;
  waterLabel: string;
  stepsLabel: string;
  sleepLabel: string;
  streakLabel: string;
  nextMealHint: string | null;
};

export function formatSleepHoursLabel(sleepSec: number | null | undefined): string {
  if (sleepSec == null) return '— ч';
  const h = Math.round((sleepSec / 3600) * 10) / 10;
  return `${h} ч`;
}

/** Build display strings for RemoteViews / preview. Units always shown; unknown → «—». */
export function formatTodayWidgetDisplay(payload: TodayWidgetPayload): TodayWidgetDisplay {
  return {
    dateLocal: payload.dateLocal,
    energyLabel: `${formatMetricValue(payload.energyKcal)} ккал`,
    waterLabel: `${formatMetricValue(payload.waterMl)} мл`,
    stepsLabel:
      payload.steps == null ? '— шаг' : `${Math.round(payload.steps).toLocaleString('ru-RU')} шаг`,
    sleepLabel: formatSleepHoursLabel(payload.sleepSec ?? null),
    streakLabel: `${formatMetricValue(payload.streakDays)} дн.`,
    nextMealHint: payload.nextMealHint,
  };
}

/**
 * Derive widget energy from diary totals: empty day or unknown macros → null.
 */
export function widgetEnergyFromTotals(totals: {
  entryCount: number;
  energyKcal: number | null;
  hasUnknownFields: boolean;
}): number | null {
  if (totals.entryCount === 0) return null;
  if (totals.hasUnknownFields) return null;
  return totals.energyKcal;
}

export const WIDGET_VARIANTS = [
  { id: 'today', name: 'nf-fit · день', description: 'Ккал, шаги, вода, сон' },
  { id: 'compact', name: 'nf-fit · ккал', description: 'Компакт: только энергия дня' },
  { id: 'movement', name: 'nf-fit · движение', description: 'Шаги и сон' },
] as const;

export const WIDGET_SCAFFOLD = {
  product: 'nf-fit',
  preferredApproach: 'config-plugin-appwidgetprovider',
  /** Providers ship via prebuild plugin; device Pass still human. */
  binaryShipped: false,
  variants: WIDGET_VARIANTS.length,
} as const;
