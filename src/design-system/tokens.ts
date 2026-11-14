/**
 * nf-fit — Fresh Utility. One runtime contract for every screen and sheet.
 * Runtime RN re-exports via apps/mobile/src/design-system/tokens.ts.
 * Cool canvas + blue accent chrome; macros / meals / training keep distinct hues.
 * Do not introduce screen-local hex colors; extend this file instead.
 */

export const colors = {
  canvas: '#EEF2F7',
  background: '#EEF2F7',
  surface: '#FFFFFF',
  surfaceMuted: '#E4EAF2',
  ink: '#0F172A',
  text: '#0F172A',
  textSecondary: '#475569',
  /** Captions / hints — ≥4.5:1 on canvas and white (WCAG AA). */
  textMuted: '#5B6578',
  /** Selected / active chrome — readable blue (not mono ink). */
  accent: '#1D5BBF',
  accentSoft: '#D6E4FA',
  onAccent: '#FFFFFF',
  /** @deprecated Prefer `primary` — kept for gradual migration. */
  primaryButton: '#1D5BBF',
  /** @deprecated Prefer `onPrimary`. */
  primaryButtonText: '#FFFFFF',
  primary: '#1D5BBF',
  onPrimary: '#FFFFFF',
  border: '#D5DCE8',
  borderStrong: '#B7C0D0',
  danger: '#B42318',
  preview: '#EEF2F7',
  /** Macro accents — data only, not competing screen themes. */
  protein: '#15803D',
  fat: '#C2410C',
  carbs: '#1D4ED8',
  /** Planned training fills — tinted so week cards are scannable. */
  trainingStrength: '#D9E4FB',
  trainingCycling: '#CFF3EA',
  warmSurface: '#F7F0E8',
  /** @deprecated Prefer `ink` for body text — kept so call sites compile. */
  sageInk: '#0F172A',
  /** Meal section accent bars — distinct hues, not gray scale. */
  mealBreakfast: '#D97706',
  mealLunch: '#1D5BBF',
  mealDinner: '#0F766E',
  mealSnack: '#EA580C',
  ringTrack: '#D9E0EA',
  ringFill: '#1D5BBF',
  success: '#15803D',
  successSoft: '#DCF5E4',
  textOnInverse: '#FFFFFF',
  shadow: '#0F172A',
  warning: '#D97706',
  chartTrack: '#D9E0EA',
  chartFill: '#1D5BBF',
  overlay: 'rgba(15,23,42,0.42)',
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
  '#94A3B8',
  '#60A5FA',
  '#34D399',
  '#FBBF24',
  '#F97316',
  '#F43F5E',
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
