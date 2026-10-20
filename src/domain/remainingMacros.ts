/** Daily macro targets / totals / remaining. Preserves unknown separately from 0. */

export type MacroFour = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type MacroRemaining = MacroFour & {
  /** True when any macro cannot be computed (missing target or total). */
  incomplete: boolean;
};

function finiteMacro(n: number | null): n is number {
  return n !== null && Number.isFinite(n);
}

/** remaining = target − total when BOTH known; else null. May be negative (overshoot). */
export function remainingField(
  target: number | null,
  total: number | null,
): number | null {
  if (!finiteMacro(target) || !finiteMacro(total)) return null;
  return target - total;
}

/**
 * Known remaining vs daily goals. Never coerces unknown → 0.
 * Overshoot (negative remaining) is allowed — guidance, not a ban.
 */
export function remainingMacros(targets: MacroFour, totals: MacroFour): MacroRemaining {
  const energyKcal = remainingField(targets.energyKcal, totals.energyKcal);
  const proteinG = remainingField(targets.proteinG, totals.proteinG);
  const fatG = remainingField(targets.fatG, totals.fatG);
  const carbG = remainingField(targets.carbG, totals.carbG);
  const incomplete =
    energyKcal === null || proteinG === null || fatG === null || carbG === null;
  return { energyKcal, proteinG, fatG, carbG, incomplete };
}

export function hasAnyKnownRemaining(r: MacroFour): boolean {
  return (
    finiteMacro(r.energyKcal) ||
    finiteMacro(r.proteinG) ||
    finiteMacro(r.fatG) ||
    finiteMacro(r.carbG)
  );
}
