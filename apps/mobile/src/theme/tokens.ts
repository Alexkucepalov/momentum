import type { ViewStyle } from 'react-native';

/**
 * Visual system locked to docs/design/refs
 * (08 soft wellness shell · 07 Nutrition list · dark log/bento).
 */
export const colors = {
  background: '#F3F3F3',
  surface: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#111111',
  accentSoft: '#EBEBEB',
  /** Coral — today / trend only. */
  focus: '#EF6E58',
  focusSoft: '#FCE8E4',
  primaryButton: '#111111',
  primaryButtonText: '#FFFFFF',
  border: '#E8E8E8',
  danger: '#B42318',
  preview: '#EEF2FF',
  /** Macro accents from Nutrition ref 07 */
  protein: '#E5484D',
  fat: '#8B5CF6',
  carbs: '#F5A524',
  calorieRing: '#F5A524',
  ringTrack: '#EBEBEB',
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
  sm: 14,
  md: 18,
  lg: 24,
  /** Soft wellness cards (ref 08). */
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  hero: 40,
  title: 28,
  subtitle: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  } satisfies ViewStyle,
} as const;

/** @deprecated Prefer <AppCard /> from src/ui */
export const surfaceCard = {
  backgroundColor: colors.surface,
  borderRadius: radius.xxl,
  ...elevation.card,
} as const satisfies ViewStyle;

export const sheetSurface = {
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius.xl,
  borderTopRightRadius: radius.xl,
  ...elevation.tabBar,
} as const satisfies ViewStyle;

export const darkSheet = {
  backgroundColor: colors.darkBg,
} as const satisfies ViewStyle;

export const darkCard = {
  backgroundColor: colors.darkSurface,
  borderRadius: radius.xl,
} as const satisfies ViewStyle;
