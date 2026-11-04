/**
 * nf-fit / Momentum — Premium Minimal Utility token contract.
 * Runtime RN re-exports via apps/mobile/src/design-system/tokens.ts.
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
  textMuted: '#8B929E',
  /**
   * Soft blue accent — selected chrome / streaks / hub icons.
   * Primary CTA stays ink (`primary`) for contrast. No teal/purple/coral chrome.
   */
  accent: '#2563EB',
  accentSoft: '#DBEAFE',
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
  protein: '#16A34A',
  fat: '#D97706',
  carbs: '#2563EB',
  /** Meal section accent bars (readable cards, not B&W). */
  mealBreakfast: '#F59E0B',
  mealLunch: '#2563EB',
  mealDinner: '#1E40AF',
  mealSnack: '#D97706',
  ringTrack: '#E8EAED',
  ringFill: '#2563EB',
  success: '#15803D',
  successSoft: '#DCF5E4',
  textOnInverse: '#FFFFFF',
  shadow: '#0A0A0A',
  warning: '#D97706',
  chartTrack: '#E8EAED',
  chartFill: '#2563EB',
  overlay: 'rgba(10,10,10,0.4)',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  /** Screen-level section break */
  section: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 16,
  xl: 24,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  metric: 36,
  hero: 34,
  title: 22,
  subtitle: 17,
  body: 15,
  caption: 13,
  label: 11,
  micro: 11,
} as const;

export const elevation = {
  none: 0,
  card: 2,
} as const;

/**
 * Target root tab shell after Overhaul Stage 3 (Movement = Activity|Sleep).
 * Temporary dogfood may still expose Sleep as a 6th tab until C1/C2 land.
 */
export const TAB_SHELL = ['today', 'food', 'movement', 'progress', 'profile'] as const;

export type TabShellId = (typeof TAB_SHELL)[number];
