/**
 * Read-only Android home-widget payload for nf-fit Today metrics.
 * Unknown nutrients stay null — never coerce to 0 for display.
 * Native widget binary is still scaffolded (see docs/13-WIDGETS-SCAFFOLD.md).
 */

import { formatMetricValue } from '../design-system/metricFormat';

export type TodayWidgetPayload = {
  dateLocal: string;
  /** Food diary energy for the day; null if empty or has unknown macros. */
  energyKcal: number | null;
  waterMl: number | null;
  /** Daily steps from Garmin; null = unknown ≠ 0. */
  steps?: number | null;
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
  streakLabel: string;
  nextMealHint: string | null;
};

/** Build display strings for RemoteViews / preview. Units always shown; unknown → «—». */
export function formatTodayWidgetDisplay(payload: TodayWidgetPayload): TodayWidgetDisplay {
  return {
    dateLocal: payload.dateLocal,
    energyLabel: `${formatMetricValue(payload.energyKcal)} ккал`,
    waterLabel: `${formatMetricValue(payload.waterMl)} мл`,
    stepsLabel:
      payload.steps == null ? '— шаг' : `${Math.round(payload.steps).toLocaleString('ru-RU')} шаг`,
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

export const WIDGET_SCAFFOLD = {
  product: 'nf-fit',
  preferredApproach: 'config-plugin-appwidgetprovider',
  binaryShipped: false,
} as const;
