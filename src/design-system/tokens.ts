/**
 * nf-fit — Fresh Utility. One runtime contract for every screen and sheet.
 * Runtime RN re-exports via apps/mobile/src/design-system/tokens.ts.
 * Do not introduce screen-local hex colors; extend this file instead.
 */

export const colors = {
  canvas: '#F7F7F2',
  background: '#F7F7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0E9',
  ink: '#20251F',
  text: '#20251F',
  textSecondary: '#626B5F',
  /** Captions / hints — WCAG AA on canvas, white and the strength surface. */
  textMuted: '#626B5F',
  /** Selected / active chrome — mono ink (no coloured brand chrome). */
  accent: '#20251F',
  accentSoft: '#EDF0E9',
  onAccent: '#FFFFFF',
  /** @deprecated Prefer `primary` — kept for gradual migration. */
  primaryButton: '#20251F',
  /** @deprecated Prefer `onPrimary`. */
  primaryButtonText: '#FFFFFF',
  primary: '#20251F',
  onPrimary: '#FFFFFF',
  border: '#E1E5DC',
  borderStrong: '#B9C2B3',
  danger: '#B42318',
  preview: '#F7F7F2',
  protein: '#52714F',
  fat: '#8C6548',
  carbs: '#4C7081',
  trainingStrength: '#E8EEE1',
  trainingCycling: '#E8F0F4',
  warmSurface: '#F8EDE3',
  sageInk: '#4B6745',
  /** Meal section accent bars — cool gray scale only. */
  mealBreakfast: '#626B5F',
  mealLunch: '#626B5F',
  mealDinner: '#20251F',
  mealSnack: '#626B5F',
  ringTrack: '#E1E5DC',
  ringFill: '#20251F',
  success: '#4B6745',
  successSoft: '#E8EEE1',
  textOnInverse: '#FFFFFF',
  shadow: '#20251F',
  warning: '#89602E',
  chartTrack: '#E1E5DC',
  chartFill: '#20251F',
  overlay: 'rgba(32,37,31,0.32)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  screen: 20,
  xxl: 32,
  /** Screen-level section break */
  section: 28,
} as const;

/** Labeled intensity buckets for imported HR data; shared by every Garmin view. */
export const HEART_RATE_ZONE_COLORS = ['#AEB8AD', '#7F999C', '#6D8B68', '#B78E63', '#AD6657', '#796C84'] as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 16,
  card: 22,
  xl: 24,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  metric: 46,
  hero: 36,
  title: 28,
  subtitle: 18,
  body: 14,
  caption: 12,
  label: 11,
  micro: 11,
} as const;

export const elevation = {
  none: 0,
  card: 0,
} as const;

/** Bundled, offline Manrope instances; font files include Cyrillic. */
export const fonts = {
  regular: 'ManropeRegular',
  medium: 'ManropeMedium',
  semibold: 'ManropeSemiBold',
} as const;

/**
 * Target root tab shell after Overhaul Stage 3 (Movement = Activity|Sleep).
 * Temporary dogfood may still expose Sleep as a 6th tab until C1/C2 land.
 */
export const TAB_SHELL = ['today', 'food', 'movement', 'progress', 'profile'] as const;

export type TabShellId = (typeof TAB_SHELL)[number];
