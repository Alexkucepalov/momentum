/**
 * nf-fit Minimal Soft Utility — pure token contract (testable, shared).
 * Runtime RN re-exports via apps/mobile/src/design-system/tokens.ts.
 */

export const colors = {
  canvas: '#F3F4F6',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  ink: '#000000',
  text: '#000000',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  /** Neutral ink accent — avoid coral/red product chrome. */
  accent: '#111827',
  accentSoft: '#E5E7EB',
  primaryButton: '#000000',
  primaryButtonText: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#B42318',
  preview: '#F3F4F6',
  protein: '#22C55E',
  fat: '#F59E0B',
  carbs: '#3B82F6',
  ringTrack: '#E8EAED',
  ringFill: '#000000',
  success: '#16A34A',
  successSoft: '#D4EDDA',
  textOnInverse: '#FFFFFF',
  shadow: '#000000',
  warning: '#FBBF24',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  card: 24,
  xl: 28,
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
  card: 1,
} as const;

/** Tab shell routes required by nf-fit blueprint. */
export const TAB_SHELL = ['today', 'food', 'activity', 'progress', 'profile'] as const;

export type TabShellId = (typeof TAB_SHELL)[number];
