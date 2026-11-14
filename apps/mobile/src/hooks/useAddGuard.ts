import { useMemo } from 'react';

import { useData } from '../state/DataContext';
import { createAddGuard } from '../../../../src/domain/addGuard';

const DEFAULT_MS = 500;

/**
 * Prevents double-tap duplicate adds: returns true once, then blocks for `ms`.
 */
export function useAddGuard(ms = DEFAULT_MS): () => boolean {
  const { allowFoodAdd } = useData();
  const guard = useMemo(() => createAddGuard(ms), [ms]);
  return ms === DEFAULT_MS ? allowFoodAdd : () => guard.tryAllow();
}
