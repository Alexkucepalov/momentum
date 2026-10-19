/** Visual tokens aligned with Momentum reference (light, minimal, black CTAs). */
export const colors = {
  background: '#F4F5F7',
  surface: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#111111',
  accentSoft: '#E8EAED',
  primaryButton: '#111111',
  primaryButtonText: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#B42318',
  preview: '#EEF2FF',
  // Macro accents (never rely on color alone — always pair with labels)
  protein: '#22C55E',
  fat: '#F59E0B',
  carbs: '#3B82F6',
  ringTrack: '#E8EAED',
  ringFill: '#111111',
  success: '#16A34A',
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
  xl: 24,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  hero: 34,
  title: 22,
  subtitle: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;
