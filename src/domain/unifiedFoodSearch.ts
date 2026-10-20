import { commonFoodAliases } from './commonFoodCatalog';
import type { FoodEntry, FoodProduct, Recipe } from '../storage/types';

export type UnifiedHit =
  | { kind: 'product'; product: FoodProduct; score: number }
  | { kind: 'recipe'; recipe: Recipe; score: number }
  | { kind: 'recent'; entry: FoodEntry; score: number };

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreName(name: string, q: string): number {
  const n = normalizeSearch(name);
  if (!n || !q) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 50;
  return 0;
}

/** Offline aliases for recipes (name tokens + import: key), no invented macros. */
export function recipeSearchAliases(recipe: Recipe): string[] {
  const out = new Set<string>();
  const name = normalizeSearch(recipe.name);
  if (name) out.add(name);
  for (const tok of name.split(/[\s,/|+\-–—]+/).filter((t) => t.length >= 3)) {
    out.add(tok);
  }
  if (recipe.id.startsWith('import:')) {
    const key = normalizeSearch(recipe.id.slice('import:'.length).replace(/[_-]+/g, ' '));
    if (key) out.add(key);
    for (const tok of key.split(/\s+/).filter((t) => t.length >= 3)) out.add(tok);
  }
  const desc = recipe.description ? normalizeSearch(recipe.description).slice(0, 80) : '';
  if (desc) {
    for (const tok of desc.split(/\s+/).filter((t) => t.length >= 4).slice(0, 6)) {
      out.add(tok);
    }
  }
  return [...out];
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

function scoreRecipe(r: Recipe, q: string): number {
  let s = scoreName(r.name, q);
  for (const alias of recipeSearchAliases(r)) {
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
  const q = normalizeSearch(args.query);
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
    const s = scoreRecipe(r, q);
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
