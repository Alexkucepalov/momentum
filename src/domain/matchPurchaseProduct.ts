/**
 * Match purchase line → existing FoodProduct (barcode, then name).
 * Never invents nutrition. Caller creates product when kind === 'none'.
 */

import type { FoodProduct } from '../storage/types';

export type PurchaseProductMatchKind = 'explicit' | 'barcode' | 'exact' | 'starts' | 'contains' | 'none';

export type PurchaseProductMatch = {
  productId: string | null;
  confidence: number | null;
  kind: PurchaseProductMatchKind;
};

export function normalizePurchaseProductName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9%.\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CONFIDENCE: Record<Exclude<PurchaseProductMatchKind, 'none'>, number> = {
  explicit: 1,
  barcode: 1,
  exact: 1,
  starts: 0.85,
  contains: 0.7,
};

/**
 * Resolve an existing catalog product for a purchase line.
 * `explicitProductId` wins when present and active.
 */
export function matchPurchaseProduct(
  input: {
    displayName: string;
    barcode?: string | null;
    productId?: string | null;
  },
  products: FoodProduct[],
): PurchaseProductMatch {
  const active = products.filter((p) => p.deletedAt == null);

  if (input.productId) {
    const hit = active.find((p) => p.id === input.productId);
    if (hit) {
      return { productId: hit.id, confidence: CONFIDENCE.explicit, kind: 'explicit' };
    }
  }

  const barcode = input.barcode?.replace(/\D/g, '') ?? '';
  if (/^\d{8,14}$/.test(barcode)) {
    const byBc = active.find((p) => p.barcode != null && p.barcode.replace(/\D/g, '') === barcode);
    if (byBc) {
      return { productId: byBc.id, confidence: CONFIDENCE.barcode, kind: 'barcode' };
    }
  }

  const q = normalizePurchaseProductName(input.displayName);
  if (!q) {
    return { productId: null, confidence: null, kind: 'none' };
  }

  const exact = active.filter((p) => normalizePurchaseProductName(p.name) === q);
  if (exact.length === 1) {
    return { productId: exact[0]!.id, confidence: CONFIDENCE.exact, kind: 'exact' };
  }

  const starts = active.filter((p) => {
    const n = normalizePurchaseProductName(p.name);
    return n.startsWith(q) || q.startsWith(n);
  });
  if (starts.length === 1) {
    return { productId: starts[0]!.id, confidence: CONFIDENCE.starts, kind: 'starts' };
  }

  const contains = active.filter((p) => {
    const n = normalizePurchaseProductName(p.name);
    return n.includes(q) || q.includes(n);
  });
  if (contains.length === 1) {
    return { productId: contains[0]!.id, confidence: CONFIDENCE.contains, kind: 'contains' };
  }

  return { productId: null, confidence: null, kind: 'none' };
}
