/**
 * Open Food Facts product normalization — no invented nutrition values.
 * Attribution: data © Open Food Facts contributors, https://openfoodfacts.org
 * ODBL / database contents under ODbL; please attribute when displaying catalog items.
 */

export type OffLookupResult =
  | {
      status: 'ok';
      barcode: string;
      name: string;
      brand: string | null;
      energyKcal: number | null;
      proteinG: number | null;
      fatG: number | null;
      carbG: number | null;
      sourceUpdatedAt: string | null;
      attribution: string;
    }
  | { status: 'not_found'; barcode: string }
  | { status: 'incomplete'; barcode: string; reason: string }
  /** Transient/malformed JSON — caller should try another host, not show «не найден». */
  | { status: 'unusable'; barcode: string };

function finiteOrNull(n: unknown): number | null {
  if (n === null || n === undefined || n === '') return null;
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v < 0) return null;
  return v;
}

function isExplicitNotFound(root: Record<string, unknown>): boolean {
  const status = root.status;
  const verbose = String(root.status_verbose ?? '').toLowerCase();
  return (
    status === 0 ||
    status === '0' ||
    status === 'failure' ||
    verbose === 'product not found' ||
    verbose.startsWith('product not found')
  );
}

function isDigitOnlyBarcodeName(value: string): boolean {
  return /^\d{8,14}$/.test(value);
}

/**
 * OFF stubs often put the GTIN in product_name/_ru while a real name lives in
 * another language field (e.g. product_name_sr) or only brands is filled.
 */
export function pickOffProductName(product: Record<string, unknown>): string | null {
  const orderedKeys = [
    'product_name_ru',
    'product_name',
    'product_name_en',
    'generic_name',
    'generic_name_ru',
    'abbreviated_product_name',
  ];
  const seen = new Set<string>();
  const push = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    const t = raw.trim();
    if (!t || isDigitOnlyBarcodeName(t) || seen.has(t)) return;
    seen.add(t);
  };

  for (const key of orderedKeys) push(product[key]);
  for (const [key, value] of Object.entries(product)) {
    if (key.startsWith('product_name_') || key.startsWith('generic_name_')) push(value);
  }

  const first = [...seen][0];
  if (first) return first;

  const brandRaw = product.brands ?? product.brand;
  const brand = brandRaw ? String(brandRaw).split(',')[0]?.trim() || null : null;
  return brand || null;
}

/**
 * Normalize OFF API v0/v2-ish product payload (fixture-friendly).
 * `not_found` only when the API explicitly says so — malformed/CDN JSON must not
 * look like a missing product (that caused false “продукт не найден”).
 */
export function normalizeOffProduct(barcode: string, payload: unknown): OffLookupResult {
  if (!payload || typeof payload !== 'object') {
    return { status: 'unusable', barcode };
  }
  const root = payload as Record<string, unknown>;
  if (isExplicitNotFound(root)) {
    return { status: 'not_found', barcode };
  }

  // Prefer nested `product`; only fall back to root when it looks like a product doc.
  const nested = root.product;
  const product = (
    nested && typeof nested === 'object'
      ? nested
      : root.product_name || root.product_name_ru || root.nutriments
        ? root
        : null
  ) as Record<string, unknown> | null;
  if (!product) {
    // e.g. rate-limit / error JSON without status:0 — keep trying other hosts
    return { status: 'unusable', barcode };
  }

  const name = pickOffProductName(product);
  if (!name) {
    return {
      status: 'incomplete',
      barcode,
      reason: 'В каталоге есть запись, но без названия — дополни с этикетки',
    };
  }

  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;
  const energyKcal =
    finiteOrNull(nutriments['energy-kcal_100g']) ??
    finiteOrNull(nutriments.energy_kcal_100g) ??
    finiteOrNull(nutriments['energy-kcal']) ??
    (() => {
      const kj =
        finiteOrNull(nutriments['energy-kj_100g']) ?? finiteOrNull(nutriments['energy-kj']);
      return kj === null ? null : Math.round((kj / 4.184) * 10) / 10;
    })();

  const proteinG =
    finiteOrNull(nutriments.proteins_100g) ?? finiteOrNull(nutriments.proteins);
  const fatG = finiteOrNull(nutriments.fat_100g) ?? finiteOrNull(nutriments.fat);
  const carbG =
    finiteOrNull(nutriments.carbohydrates_100g) ??
    finiteOrNull(nutriments.carbohydrates) ??
    finiteOrNull(nutriments.carbs_100g);

  const brandRaw = product.brands ?? product.brand;
  const brand = brandRaw ? String(brandRaw).split(',')[0]?.trim() || null : null;

  return {
    status: 'ok',
    barcode,
    name,
    brand,
    energyKcal,
    proteinG,
    fatG,
    carbG,
    sourceUpdatedAt: product.last_updated_t
      ? new Date(Number(product.last_updated_t) * 1000).toISOString()
      : null,
    attribution: 'Open Food Facts',
  };
}
