/**
 * Recipe ingredient coverage vs home pantry.
 * Does not invent quantities: null pantry qty still marks «present» by name/id
 * for soft at-home hints, but shopping continues to treat unknown as 0 cover.
 */

import { normalizeShoppingName } from './aggregateShopping';

export type RecipeCoverageIngredient = {
  displayName: string;
  productId?: string | null;
  /** Optional; unused for presence match (unknown ≠ required amount here). */
  rawGrams?: number | null;
};

export type RecipeCoveragePantryItem = {
  displayName: string;
  productId?: string | null;
  deletedAt?: string | null;
};

export type RecipePantryCoverage = {
  totalIngredients: number;
  matchedCount: number;
  /** 0..1 when totalIngredients > 0; null when recipe has no ingredients. */
  ratio: number | null;
  available: string[];
  missing: string[];
  /** True when every named ingredient has a pantry match. */
  fullyCovered: boolean;
};

function pantryKeys(pantry: RecipeCoveragePantryItem[]): {
  names: Set<string>;
  productIds: Set<string>;
} {
  const names = new Set<string>();
  const productIds = new Set<string>();
  for (const p of pantry) {
    if (p.deletedAt) continue;
    const n = normalizeShoppingName(p.displayName);
    if (n) names.add(n);
    if (p.productId) productIds.add(p.productId);
  }
  return { names, productIds };
}

/**
 * Match ingredients to pantry by productId or normalized display name.
 * Empty/whitespace ingredient names are skipped (not counted in total).
 */
export function recipePantryCoverage(
  ingredients: RecipeCoverageIngredient[],
  pantry: RecipeCoveragePantryItem[],
): RecipePantryCoverage {
  const { names, productIds } = pantryKeys(pantry);
  const available: string[] = [];
  const missing: string[] = [];

  for (const ing of ingredients) {
    const label = ing.displayName.trim();
    if (!label) continue;
    const byId = ing.productId != null && productIds.has(ing.productId);
    const byName = names.has(normalizeShoppingName(label));
    if (byId || byName) available.push(label);
    else missing.push(label);
  }

  const totalIngredients = available.length + missing.length;
  if (totalIngredients === 0) {
    return {
      totalIngredients: 0,
      matchedCount: 0,
      ratio: null,
      available: [],
      missing: [],
      fullyCovered: false,
    };
  }

  const matchedCount = available.length;
  return {
    totalIngredients,
    matchedCount,
    ratio: matchedCount / totalIngredients,
    available,
    missing,
    fullyCovered: missing.length === 0,
  };
}

/** Short RU badge for lists: «2/5 дома» or null when unknown. */
export function formatPantryCoverageBadge(coverage: RecipePantryCoverage): string | null {
  if (coverage.totalIngredients === 0 || coverage.ratio == null) return null;
  return `${coverage.matchedCount}/${coverage.totalIngredients} дома`;
}
