import { commonFoodAliases } from './commonFoodCatalog';
import type { FoodEntry, FoodProduct, Recipe } from '../storage/types';

export type UnifiedHit =
  | { kind: 'product'; product: FoodProduct; score: number }
  | { kind: 'recipe'; recipe: Recipe; score: number }
  | { kind: 'recent'; entry: FoodEntry; score: number };

function scoreName(name: string, q: string): number {
  const n = name.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 50;
  return 0;
}

function scoreProduct(p: FoodProduct, q: string): number {
  let s = scoreName(p.name, q);
  if (p.brand) s = Math.max(s, scoreName(p.brand, q) * 0.5);
  if (p.barcode && p.barcode.includes(q)) s = Math.max(s, 60);
  for (const alias of commonFoodAliases(p.id)) {
    s = Math.max(s, scoreName(alias, q));
  }
  return s;
}

/**
 * Search products, recipes and recent entries in one list.
 * Higher score first; recent matches slightly boosted for speed of repeat.
 */
export function unifiedFoodSearch(args: {
  query: string;
  products: FoodProduct[];
  recipes: Recipe[];
  recent: FoodEntry[];
  limit?: number;
}): UnifiedHit[] {
  const q = args.query.trim().toLowerCase();
  if (!q) return [];
  const limit = args.limit ?? 40;
  const hits: UnifiedHit[] = [];

  for (const e of args.recent) {
    const s = scoreName(e.displayName, q);
    if (s > 0) hits.push({ kind: 'recent', entry: e, score: s + 8 });
  }
  for (const p of args.products) {
    const s = scoreProduct(p, q);
    if (s > 0) hits.push({ kind: 'product', product: p, score: s });
  }
  for (const r of args.recipes) {
    const s = scoreName(r.name, q);
    if (s > 0) hits.push({ kind: 'recipe', recipe: r, score: s + 2 });
  }

  hits.sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind));
  const seenProducts = new Set<string>();
  const seenRecipes = new Set<string>();
  const out: UnifiedHit[] = [];
  for (const h of hits) {
    if (h.kind === 'recent') {
      if (h.entry.productId) seenProducts.add(h.entry.productId);
      if (h.entry.recipeId) seenRecipes.add(h.entry.recipeId);
      out.push(h);
    } else if (h.kind === 'product') {
      if (seenProducts.has(h.product.id)) continue;
      seenProducts.add(h.product.id);
      out.push(h);
    } else {
      if (seenRecipes.has(h.recipe.id)) continue;
      seenRecipes.add(h.recipe.id);
      out.push(h);
    }
    if (out.length >= limit) break;
  }
  return out;
}
