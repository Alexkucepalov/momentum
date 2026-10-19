import { useCallback, useRef } from 'react';

const DEFAULT_MS = 500;

/**
 * Prevents double-tap duplicate adds: returns true once, then blocks for `ms`.
 */
export function useAddGuard(ms = DEFAULT_MS): () => boolean {
  const lockedUntil = useRef(0);
  return useCallback(() => {
    const now = Date.now();
    if (now < lockedUntil.current) return false;
    lockedUntil.current = now + ms;
    return true;
  }, [ms]);
}
