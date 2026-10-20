import { useMemo } from 'react';

import { createAddGuard } from '../../../../src/domain/addGuard';

const DEFAULT_MS = 500;

/**
 * Prevents double-tap duplicate adds: returns true once, then blocks for `ms`.
 */
export function useAddGuard(ms = DEFAULT_MS): () => boolean {
  const guard = useMemo(() => createAddGuard(ms), [ms]);
  return () => guard.tryAllow();
}
