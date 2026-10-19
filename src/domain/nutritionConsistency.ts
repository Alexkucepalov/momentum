/**
 * Soft consistency check for labeled energy vs macros.
 * Does NOT replace label kcal with 4/9/4 — only flags large gaps.
 */

export type NutritionFields = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

/** Atwater factors: protein×4 + fat×9 + carbs×4. */
export function estimatedKcalFromMacros(
  proteinG: number,
  fatG: number,
  carbG: number,
): number {
  return proteinG * 4 + fatG * 9 + carbG * 4;
}

/**
 * Rounded kcal from complete macros. Returns null if any macro is unknown
 * (does not treat empty as zero).
 */
export function kcalFromCompleteMacros(
  proteinG: number | null,
  fatG: number | null,
  carbG: number | null,
): number | null {
  if (proteinG === null || fatG === null || carbG === null) return null;
  if (
    ![proteinG, fatG, carbG].every((n) => Number.isFinite(n) && n >= 0)
  ) {
    return null;
  }
  return Math.round(estimatedKcalFromMacros(proteinG, fatG, carbG));
}

/** Parse a UI decimal field; empty → null (unknown). */
export function parseMacroField(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * If Б/Ж/У all filled, return rounded kcal string for the kcal input.
 * Otherwise null (leave kcal unchanged).
 */
export function autoKcalStringFromMacroStrings(
  protein: string,
  fat: string,
  carbs: string,
): string | null {
  const kcal = kcalFromCompleteMacros(
    parseMacroField(protein),
    parseMacroField(fat),
    parseMacroField(carbs),
  );
  return kcal === null ? null : String(kcal);
}

/**
 * Returns a short RU hint when all four values are known and diverge by >15%
 * (or absolute >40 kcal when energy is small). Returns null when unknown or consistent.
 */
export function nutritionConsistencyHint(
  fields: NutritionFields,
  thresholdRatio = 0.15,
): string | null {
  const { energyKcal, proteinG, fatG, carbG } = fields;
  if (
    energyKcal === null ||
    proteinG === null ||
    fatG === null ||
    carbG === null
  ) {
    return null;
  }
  if (
    ![energyKcal, proteinG, fatG, carbG].every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  ) {
    return null;
  }

  const fromMacros = estimatedKcalFromMacros(proteinG, fatG, carbG);
  const delta = Math.abs(energyKcal - fromMacros);
  const denom = Math.max(energyKcal, fromMacros, 1);
  const ratio = delta / denom;
  const absoluteFloor = 40;

  if (ratio <= thresholdRatio && delta <= absoluteFloor) {
    return null;
  }
  if (delta <= absoluteFloor) {
    return null;
  }

  return 'ккал и БЖУ расходятся (этикетка не пересчитывается)';
}
