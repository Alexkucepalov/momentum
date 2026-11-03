/**
 * Read-only Android home-widget payload for nf-fit day metrics.
 * Unknown stays null — never coerce to 0.
 * Native: Nothing-light widgets via `withNfFitWidgets.js`.
 */

import { formatMetricValue } from '../design-system/metricFormat';

export type TodayWidgetPayload = {
  dateLocal: string;
  energyKcal: number | null;
  waterMl: number | null;
  steps?: number | null;
  sleepSec?: number | null;
  /** Optional targets for dot progress (null = no bar). */
  energyTargetKcal?: number | null;
  waterTargetMl?: number | null;
  streakDays: number | null;
  nextMealHint: string | null;
};

export type TodayWidgetDisplay = {
  dateLocal: string;
  /** Short day label for widget chrome, e.g. 03.11 */
  dayLabel: string;
  energyLabel: string;
  waterLabel: string;
  stepsLabel: string;
  sleepLabel: string;
  streakLabel: string;
  nextMealHint: string | null;
  /** Big pixel numerals (ASCII-safe). */
  energyValue: string;
  stepsValue: string;
  waterValue: string;
  sleepValue: string;
  /** Dot bars ········ filled with ● */
  energyDots: string;
  waterDots: string;
};

const DOTS = 8;

export function formatSleepHoursLabel(sleepSec: number | null | undefined): string {
  if (sleepSec == null) return '— ч';
  const h = Math.round((sleepSec / 3600) * 10) / 10;
  return `${h} ч`;
}

function dayLabelFromIso(dateLocal: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateLocal);
  if (!m) return dateLocal;
  return `${m[3]}.${m[2]}`;
}

function dotBar(value: number | null | undefined, target: number | null | undefined): string {
  if (value == null || target == null || !(target > 0) || !Number.isFinite(value)) {
    return '········';
  }
  const ratio = Math.max(0, Math.min(1, value / target));
  const filled = Math.round(ratio * DOTS);
  return `${'●'.repeat(filled)}${'·'.repeat(DOTS - filled)}`;
}

/** Build display strings for RemoteViews. Unknown → «—». */
export function formatTodayWidgetDisplay(payload: TodayWidgetPayload): TodayWidgetDisplay {
  const sleepH =
    payload.sleepSec == null ? null : Math.round((payload.sleepSec / 3600) * 10) / 10;
  return {
    dateLocal: payload.dateLocal,
    dayLabel: dayLabelFromIso(payload.dateLocal),
    energyLabel: `${formatMetricValue(payload.energyKcal)} ккал`,
    waterLabel: `${formatMetricValue(payload.waterMl)} мл`,
    stepsLabel:
      payload.steps == null ? '— шаг' : `${Math.round(payload.steps).toLocaleString('ru-RU')} шаг`,
    sleepLabel: formatSleepHoursLabel(payload.sleepSec ?? null),
    streakLabel: `${formatMetricValue(payload.streakDays)} дн.`,
    nextMealHint: payload.nextMealHint,
    energyValue: payload.energyKcal == null ? '—' : String(Math.round(payload.energyKcal)),
    stepsValue: payload.steps == null ? '—' : String(Math.round(payload.steps)),
    waterValue:
      payload.waterMl == null
        ? '—'
        : payload.waterMl >= 1000
          ? (payload.waterMl / 1000).toFixed(1)
          : String(Math.round(payload.waterMl)),
    sleepValue: sleepH == null ? '—' : String(sleepH),
    energyDots: dotBar(payload.energyKcal, payload.energyTargetKcal ?? null),
    waterDots: dotBar(payload.waterMl, payload.waterTargetMl ?? null),
  };
}

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
  { id: 'today', name: 'nf-fit · day', description: 'Ккал · шаги · вода · сон' },
  { id: 'kcal', name: 'nf-fit · kcal', description: 'Энергия дня' },
  { id: 'steps', name: 'nf-fit · steps', description: 'Шаги' },
  { id: 'water', name: 'nf-fit · water', description: 'Вода' },
  { id: 'sleep', name: 'nf-fit · sleep', description: 'Сон' },
] as const;

export const WIDGET_SCAFFOLD = {
  product: 'nf-fit',
  preferredApproach: 'config-plugin-appwidgetprovider',
  style: 'nothing-light-pixel',
  binaryShipped: false,
  variants: WIDGET_VARIANTS.length,
} as const;
