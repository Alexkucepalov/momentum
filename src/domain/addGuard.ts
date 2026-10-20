/**
 * Pure double-submit guard for food adds.
 * UI: `useAddGuard`.
 *
 * Contract:
 * - Blocks accidental double-fire within `cooldownMs` (default 500).
 * - Does **not** permanently lock a product: after cooldown, the same
 *   product/recipe can be added again intentionally (second serving).
 * - Prefer larger grams / portion sheet for “2×” rather than &lt;500ms double-tap.
 */
export type AddGuard = {
  /** @returns true if this press may proceed; false if blocked. */
  tryAllow: (nowMs?: number) => boolean;
  /** Test helper — ms until next allow (0 if ready). */
  blockedForMs: (nowMs?: number) => number;
  /** Clears lock so the next tryAllow succeeds (tests / after intentional UX). */
  reset: () => void;
};

export function createAddGuard(cooldownMs = 500): AddGuard {
  if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
    throw new Error('Invalid cooldownMs');
  }
  let lockedUntil = 0;
  return {
    tryAllow(nowMs = Date.now()) {
      if (nowMs < lockedUntil) return false;
      lockedUntil = nowMs + cooldownMs;
      return true;
    },
    blockedForMs(nowMs = Date.now()) {
      return Math.max(0, lockedUntil - nowMs);
    },
    reset() {
      lockedUntil = 0;
    },
  };
}
