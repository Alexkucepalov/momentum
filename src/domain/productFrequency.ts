/**
 * Local frequency index from diary entries — no invented products.
 * Higher log count → higher rank for catalog / offline barcode fallback.
 */

export type ProductFrequency = {
  productId: string;
  count: number;
};

/**
 * Rank productIds by how often they appear in non-deleted diary entries.
 * Ties break by productId for stability. Entries without productId are ignored.
 */
export function rankProductFrequency(
  entries: Array<{ productId: string | null; deletedAt?: string | null }>,
): ProductFrequency[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e.deletedAt != null) continue;
    if (!e.productId) continue;
    counts.set(e.productId, (counts.get(e.productId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([productId, count]) => ({ productId, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.productId.localeCompare(b.productId);
    });
}

/** Sort products by frequency map (missing → 0), stable by name. */
export function sortProductsByFrequency<T extends { id: string; name: string }>(
  products: T[],
  frequencyById: Map<string, number>,
): T[] {
  return [...products].sort((a, b) => {
    const fa = frequencyById.get(a.id) ?? 0;
    const fb = frequencyById.get(b.id) ?? 0;
    if (fb !== fa) return fb - fa;
    return a.name.localeCompare(b.name, 'ru');
  });
}
