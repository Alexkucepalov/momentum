import type { ViewStyle } from 'react-native';

/**
 * Design contract: Nutrition Soft Light
 * @see docs/quality/DESIGN-RESET-AUDIT.md §5
 * @see docs/design/refs/07-nutrition-light.png (shell etalon)
 *
 * Dark surfaces = focused log sheets only (weight).
 * Coral = today marker / week trend only.
 */
export const colors = {
  background: '#F5F5F5',
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
  sm: 12,
  md: 16,
  lg: 20,
  /** Default card / sheet (Nutrition Soft Light). */
  xl: 24,
  /** Rare oversized hero only — prefer xl. */
  xxl: 28,
  pill: 999,
} as const;

export const touchMin = 48;

export const type = {
  hero: 34,
  title: 24,
  subtitle: 17,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const elevation = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
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

/**
 * @deprecated Prefer `<AppCard />`. Kept as style alias for migration.
 * New code must not spread this into ad-hoc Views.
 */
export const surfaceCard = {
  backgroundColor: colors.surface,
  borderRadius: radius.xl,
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
