import { useEffect, useRef } from 'react';

import { autoKcalStringFromMacroStrings } from '../../../../src/domain/nutritionConsistency';

/**
 * When protein/fat/carbs are all filled, set kcal via Atwater 4/9/4.
 * - syncFromStart true: blank forms (manual / quick).
 * - syncFromStart false + seedKey: keep label kcal until user edits a macro.
 */
export function useAutoKcalFromMacros({
  protein,
  fat,
  carbs,
  setKcal,
  enabled = true,
  syncFromStart = true,
  seedKey,
}: {
  protein: string;
  fat: string;
  carbs: string;
  setKcal: (value: string) => void;
  enabled?: boolean;
  syncFromStart?: boolean;
  /** Change when loading a new product/recipe so auto does not overwrite label kcal. */
  seedKey?: string | number | boolean | null;
}) {
  const macrosTouched = useRef(syncFromStart);
  const prevMacros = useRef({ protein, fat, carbs });
  const lastSeed = useRef(seedKey);
  /** After seedKey change, ignore the next macro fill from the seed effect ('' → values). */
  const ignoreNextMacroFill = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (seedKey !== lastSeed.current) {
      lastSeed.current = seedKey;
      macrosTouched.current = syncFromStart;
      prevMacros.current = { protein, fat, carbs };
      ignoreNextMacroFill.current = !syncFromStart;
      return;
    }

    const changed =
      prevMacros.current.protein !== protein ||
      prevMacros.current.fat !== fat ||
      prevMacros.current.carbs !== carbs;
    prevMacros.current = { protein, fat, carbs };

    if (changed && ignoreNextMacroFill.current) {
      ignoreNextMacroFill.current = false;
      return;
    }

    if (changed) {
      macrosTouched.current = true;
    }
    if (!macrosTouched.current) return;

    const next = autoKcalStringFromMacroStrings(protein, fat, carbs);
    if (next !== null) setKcal(next);
  }, [protein, fat, carbs, setKcal, enabled, syncFromStart, seedKey]);
}
