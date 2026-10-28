/**
 * Shared Soft Light date-control metrics (DayStrip + DateSwitcher).
 * Keep chip / bar touch targets aligned across Today vs Food/Activity.
 */
import { touchMin } from '@/src/theme/tokens';

export const dateChrome = {
  /** Min height for day chips / date bar. */
  controlMin: touchMin,
  chipMin: 48,
} as const;
