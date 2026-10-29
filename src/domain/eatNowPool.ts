import type { FoodProduct, PantryItem, Recipe } from '../storage/types';
import { normalizeShoppingName } from './aggregateShopping';

/** Seed / catalog rows that are not useful as a meal suggestion. */
const NOISE_SEED_IDS = new Set([
  'seed:water',
  'seed:tea',
  'seed:coffee-black',
  'seed:oil-sunflower',
  'seed:oil-olive',
  'seed:sugar',
  'seed:onion',
  'seed:butter',
]);

export function isEatNowNoiseProduct(p: FoodProduct): boolean {
  if (NOISE_SEED_IDS.has(p.id)) return true;
  const kcal = p.energyKcal;
  const protein = p.proteinG;
  if (kcal !== null && kcal <= 5 && (protein === null || protein < 1)) return true;
  return false;
}

export function isCatalogSeedProduct(p: FoodProduct): boolean {
  return p.id.startsWith('seed:');
}

/**
 * Product ids considered «дома»: явный productId в pantry
 * или совпадение нормализованного имени с запасом.
 */
export function pantryAtHomeProductIds(
  pantry: PantryItem[],
  products: FoodProduct[],
): Set<string> {
  const ids = new Set<string>();
  const pantryNames = new Set(
    pantry.filter((p) => !p.deletedAt).map((p) => normalizeShoppingName(p.displayName)),
  );
  for (const p of pantry) {
    if (p.deletedAt) continue;
    if (p.productId) ids.add(p.productId);
  }
  for (const prod of products) {
    if (prod.deletedAt) continue;
    if (pantryNames.has(normalizeShoppingName(prod.name))) ids.add(prod.id);
  }
  return ids;
}

export type EatNowPoolOptions = {
  recipes: Recipe[];
  products: FoodProduct[];
  pantry: PantryItem[];
  frequentIds: Set<string>;
  batchRecipeIds: Set<string>;
};

/**
 * Which products belong in the default «полезный» пул (не весь справочник).
 * Recipes / batches handled separately by caller.
 */
export function selectEatNowProducts(opts: EatNowPoolOptions): {
  atHomeIds: Set<string>;
  usefulProducts: FoodProduct[];
  buyProducts: FoodProduct[];
} {
  const atHomeIds = pantryAtHomeProductIds(opts.pantry, opts.products);
  const useful: FoodProduct[] = [];
  const buy: FoodProduct[] = [];

  for (const p of opts.products) {
    if (p.deletedAt || isEatNowNoiseProduct(p)) continue;
    const atHome = atHomeIds.has(p.id);
    const usefulHit =
      atHome ||
      p.isFavorite ||
      opts.frequentIds.has(p.id) ||
      p.source === 'user' ||
      !isCatalogSeedProduct(p);

    if (usefulHit) useful.push(p);
    if (!atHome && (isCatalogSeedProduct(p) || p.source === 'user' || p.source === 'catalog')) {
      buy.push(p);
    }
  }

  return { atHomeIds, usefulProducts: useful, buyProducts: buy };
}

/** Recipes with leftovers count as at-home for meal-prep. */
export function recipeAtHome(recipeId: string, batchRecipeIds: Set<string>): boolean {
  return batchRecipeIds.has(recipeId);
}
