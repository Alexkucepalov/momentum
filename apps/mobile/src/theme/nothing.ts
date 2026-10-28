/**
 * Nothing-inspired visual language for non-Food screens.
 * Do not replace `tokens.ts` — Food tab keeps Momentum light cards.
 * Accent red is signal-only (alerts), never for primary controls.
 */
export const nothing = {
  bg: '#F2F2F2',
  surface: '#FFFFFF',
  raised: '#EDEDED',
  line: '#E5E7EB',
  lineStrong: '#CFCFCF',
  text: '#1C1C1C',
  display: '#000000',
  secondary: '#585A5A',
  muted: '#9A9A9A',
  invert: '#000000',
  invertText: '#FFFFFF',
  signal: '#D71921',
  success: '#3D8B4A',
  warning: '#9C6B00',
} as const;

export const nothingType = {
  hero: 40,
  title: 22,
  subtitle: 16,
  body: 15,
  caption: 12,
  micro: 10,
  letterWide: 1.4,
} as const;

export const nothingSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
} as const;

export const nothingRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;
