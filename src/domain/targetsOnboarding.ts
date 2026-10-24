import type { Profile } from '../storage/types';

/** True when user has not set any daily KBJU targets. */
export function hasNoDailyTargets(profile: Pick<
  Profile,
  'dailyEnergyKcal' | 'dailyProteinG' | 'dailyFatG' | 'dailyCarbG'
>): boolean {
  return (
    profile.dailyEnergyKcal == null &&
    profile.dailyProteinG == null &&
    profile.dailyFatG == null &&
    profile.dailyCarbG == null
  );
}

/**
 * UX-03: show first-run goals sheet once when targets empty and not dismissed.
 * Skip must not invent kcal — only set targetsPromptDismissedAt.
 */
export function shouldShowTargetsOnboarding(profile: Profile): boolean {
  if (!hasNoDailyTargets(profile)) return false;
  return profile.targetsPromptDismissedAt == null;
}
