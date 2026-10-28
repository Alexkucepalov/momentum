import type { ViewStyle } from 'react-native';

/**
 * Visual tokens locked to docs/design/refs:
 * 01-home-light · 02-weight-log-dark · 03-workouts-bento-dark
 */
export const colors = {
  background: '#F2F2F2',
  surface: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#111111',
  accentSoft: '#E8EAED',
  /** Coral — today / trend only (ref 01). CTAs stay black. */
  focus: '#EF6E58',
  focusSoft: '#FCE8E4',
  primaryButton: '#111111',
  primaryButtonText: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#B42318',
  preview: '#EEF2FF',
  protein: '#22C55E',
  fat: '#F59E0B',
  carbs: '#3B82F6',
  ringTrack: '#E8EAED',
  ringFill: '#111111',
  success: '#16A34A',
  successSoft: '#D4EDDA',
  textOnInverse: '#FFFFFF',
  shadow: '#000000',
  warning: '#FBBF24',
  overlayScrim: 'rgba(17, 17, 17, 0.45)',
  chipOnInverse: 'rgba(255, 255, 255, 0.22)',
  cameraMask: 'rgba(0, 0, 0, 0.55)',
  cameraMaskHeavy: 'rgba(0, 0, 0, 0.72)',
  successOverlay: 'rgba(22, 163, 74, 0.28)',
  inverseHairline: 'rgba(255, 255, 255, 0.4)',
  /** Ref 02 / 03 dark sheets */
  darkBg: '#000000',
  darkSurface: '#1C1C1E',
  darkSurfaceRaised: '#2C2C2E',
  darkText: '#FFFFFF',
  darkTextSecondary: '#A1A1AA',
  darkTextMuted: '#71717A',
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
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  hero: 36,
  title: 28,
  subtitle: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  } satisfies ViewStyle,
} as const;

export const surfaceCard = {
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
  ...elevation.card,
} as const satisfies ViewStyle;

/** Light modal / sheet chrome. */
export const sheetSurface = {
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
  ...elevation.tabBar,
} as const satisfies ViewStyle;

/** Ref 02 dark focused log. */
export const darkSheet = {
  backgroundColor: colors.darkBg,
} as const satisfies ViewStyle;

export const darkCard = {
  backgroundColor: colors.darkSurface,
  borderRadius: radius.xl,
} as const satisfies ViewStyle;
