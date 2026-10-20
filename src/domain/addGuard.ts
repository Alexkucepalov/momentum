/**
 * Pure double-submit guard for food adds.
 * UI wraps this in a React ref via `useAddGuard`.
 */
export type AddGuard = {
  /** @returns true if this press may proceed; false if blocked. */
  tryAllow: (nowMs?: number) => boolean;
  /** Test helper — ms until next allow (0 if ready). */
  blockedForMs: (nowMs?: number) => number;
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
  };
}
