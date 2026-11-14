/**
 * nf-fit — Fresh Utility. One runtime contract for every screen and sheet.
 * Runtime RN re-exports via apps/mobile/src/design-system/tokens.ts.
 * Neutral cool gray + graphite chrome (no sage/green canvas).
 * Do not introduce screen-local hex colors; extend this file instead.
 */

export const colors = {
  canvas: '#F2F3F5',
  background: '#F2F3F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EBEDF0',
  ink: '#0A0A0A',
  text: '#0A0A0A',
  textSecondary: '#5C6370',
  /** Captions / hints — ≥4.5:1 on canvas and white (WCAG AA). */
  textMuted: '#646B78',
  /** Selected / active chrome — mono ink (no coloured brand chrome). */
  accent: '#0A0A0A',
  accentSoft: '#EBEDF0',
  onAccent: '#FFFFFF',
  /** @deprecated Prefer `primary` — kept for gradual migration. */
  primaryButton: '#0A0A0A',
  /** @deprecated Prefer `onPrimary`. */
  primaryButtonText: '#FFFFFF',
  primary: '#0A0A0A',
  onPrimary: '#FFFFFF',
  border: '#E2E5EA',
  borderStrong: '#C9CED6',
  danger: '#B42318',
  preview: '#F2F3F5',
  /** Macro accents — data only, not chrome. */
  protein: '#15803D',
  fat: '#C2410C',
  carbs: '#1D4ED8',
  trainingStrength: '#EBEDF0',
  trainingCycling: '#E8EEF4',
  warmSurface: '#F5F0EA',
  /** @deprecated Prefer `ink` / `accent` — kept so call sites compile. */
  sageInk: '#0A0A0A',
  /** Meal section accent bars — cool gray scale only. */
  mealBreakfast: '#8B929E',
  mealLunch: '#5C6370',
  mealDinner: '#0A0A0A',
  mealSnack: '#C9CED6',
  ringTrack: '#E8EAED',
  ringFill: '#0A0A0A',
  success: '#15803D',
  successSoft: '#DCF5E4',
  textOnInverse: '#FFFFFF',
  shadow: '#0A0A0A',
  warning: '#D97706',
  chartTrack: '#E8EAED',
  chartFill: '#0A0A0A',
  overlay: 'rgba(10,10,10,0.4)',
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
export const HEART_RATE_ZONE_COLORS = [
  '#AEB6BF',
  '#7A8B99',
  '#5C6B78',
  '#B78E63',
  '#AD6657',
  '#796C84',
] as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 18,
  card: 24,
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
