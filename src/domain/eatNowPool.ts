import type { FoodProduct } from '../storage/types';

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

export type EatNowPoolOptions = {
  products: FoodProduct[];
  frequentIds: Set<string>;
};

/**
 * Products for the default Eat Now pool: personal, favorite, frequent or
 * non-seed — never the whole reference catalog.
 */
export function selectEatNowProducts(opts: EatNowPoolOptions): FoodProduct[] {
  return opts.products.filter(
    (p) =>
      !p.deletedAt &&
      !isEatNowNoiseProduct(p) &&
      (p.isFavorite ||
        opts.frequentIds.has(p.id) ||
        p.source === 'user' ||
        !isCatalogSeedProduct(p)),
  );
}

/** Case-insensitive substring match on the visible title; empty query matches all. */
export function matchesEatNowQuery(title: string, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('ru');
  if (!q) return true;
  return title.toLocaleLowerCase('ru').includes(q);
}

/** Recipes with leftovers are reheat-quick. */
export function recipeHasBatch(recipeId: string, batchRecipeIds: Set<string>): boolean {
  return batchRecipeIds.has(recipeId);
}
