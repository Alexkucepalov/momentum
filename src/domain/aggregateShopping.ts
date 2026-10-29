export type ShoppingUnit = 'g' | 'ml' | 'pcs';

export type ShoppingPriceSource = 'user' | 'receipt' | 'estimate';

export type ShoppingIngredientInput = {
  displayName: string;
  quantity: number;
  unit: ShoppingUnit;
  /** Optional link for pantry matching. */
  productId?: string | null;
};

export type PantryCoverageInput = {
  displayName: string;
  productId?: string | null;
  quantityG: number | null;
  quantityCount: number | null;
  unit: ShoppingUnit;
};

export type ShoppingLine = {
  key: string;
  displayName: string;
  quantity: number;
  unit: ShoppingUnit;
  coveredByPantry: number;
  needToBuy: number;
  priceRub: number | null;
  priceAsOf: string | null;
  priceSource: ShoppingPriceSource | null;
};

export type BasketTotal = {
  /** null when any needed line lacks price (or nothing to buy). */
  totalRub: number | null;
  pricedNeedCount: number;
  needLineCount: number;
  /** Honest UI copy — never «цена сегодня». */
  label: string;
};

function assertQty(n: number, label: string): void {
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${label}`);
}

/** Normalize name for merge key (lowercase, trim, collapse spaces). */
export function normalizeShoppingName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е');
}

export function shoppingKey(displayName: string, unit: ShoppingUnit): string {
  return `${normalizeShoppingName(displayName)}|${unit}`;
}

/**
 * Scale recipe ingredient grams for a served portion.
 * unknown yield rejected; does not invent macros.
 */
export function scaleIngredientGrams(
  rawGrams: number,
  cookedYieldG: number,
  servedGrams: number,
): number {
  assertQty(rawGrams, 'rawGrams');
  assertQty(servedGrams, 'servedGrams');
  if (!Number.isFinite(cookedYieldG) || cookedYieldG <= 0) throw new Error('Invalid cookedYieldG');
  return (rawGrams * servedGrams) / cookedYieldG;
}

function pantryAmount(p: PantryCoverageInput, unit: ShoppingUnit): number {
  if (p.unit !== unit) return 0;
  if (unit === 'pcs') {
    return p.quantityCount !== null && Number.isFinite(p.quantityCount) ? p.quantityCount : 0;
  }
  return p.quantityG !== null && Number.isFinite(p.quantityG) ? p.quantityG : 0;
}

/**
 * Merge identical ingredients; subtract known pantry coverage.
 * Prices optional — unknown stays null (never 0).
 */
export function aggregateShopping(
  ingredients: ShoppingIngredientInput[],
  pantry: PantryCoverageInput[] = [],
  prices?: Map<string, { priceRub: number; priceAsOf: string; priceSource: ShoppingPriceSource }>,
): ShoppingLine[] {
  const merged = new Map<string, { displayName: string; quantity: number; unit: ShoppingUnit; productIds: Set<string> }>();

  for (const ing of ingredients) {
    assertQty(ing.quantity, 'quantity');
    const name = ing.displayName.trim();
    if (!name) continue;
    const key = shoppingKey(name, ing.unit);
    const cur = merged.get(key);
    if (cur) {
      cur.quantity += ing.quantity;
      if (ing.productId) cur.productIds.add(ing.productId);
    } else {
      merged.set(key, {
        displayName: name,
        quantity: ing.quantity,
        unit: ing.unit,
        productIds: new Set(ing.productId ? [ing.productId] : []),
      });
    }
  }

  const lines: ShoppingLine[] = [];
  for (const [key, cur] of merged) {
    let covered = 0;
    for (const p of pantry) {
      const nameMatch = normalizeShoppingName(p.displayName) === normalizeShoppingName(cur.displayName);
      const idMatch = p.productId != null && cur.productIds.has(p.productId);
      if (!nameMatch && !idMatch) continue;
      covered += pantryAmount(p, cur.unit);
    }
    if (!Number.isFinite(covered) || covered < 0) covered = 0;
    const needToBuy = Math.max(0, cur.quantity - covered);
    const price = prices?.get(key) ?? null;
    lines.push({
      key,
      displayName: cur.displayName,
      quantity: cur.quantity,
      unit: cur.unit,
      coveredByPantry: covered,
      needToBuy,
      priceRub: price?.priceRub ?? null,
      priceAsOf: price?.priceAsOf ?? null,
      priceSource: price?.priceSource ?? null,
    });
  }

  return lines.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));
}

/** Actionable shop rows: still need to buy (and not already checked if provided). */
export function filterMissingShoppingItems<T extends { needToBuy: number; checked?: boolean }>(
  items: T[],
  opts?: { includeChecked?: boolean },
): T[] {
  const includeChecked = opts?.includeChecked === true;
  return items.filter((i) => i.needToBuy > 0 && (includeChecked || !i.checked));
}

/**
 * Basket total for lines that still need buying.
 * If any needToBuy>0 line lacks price → totalRub null + partial label.
 */
export function estimateBasketTotal(lines: ShoppingLine[]): BasketTotal {
  const need = lines.filter((l) => l.needToBuy > 0);
  if (need.length === 0) {
    return {
      totalRub: 0,
      pricedNeedCount: 0,
      needLineCount: 0,
      label: 'Покупать нечего',
    };
  }
  let sum = 0;
  let priced = 0;
  for (const l of need) {
    if (l.priceRub === null || !Number.isFinite(l.priceRub)) continue;
    sum += l.priceRub;
    priced += 1;
  }
  if (priced === 0) {
    return {
      totalRub: null,
      pricedNeedCount: 0,
      needLineCount: need.length,
      label: 'Сумма неизвестна',
    };
  }
  if (priced < need.length) {
    return {
      totalRub: null,
      pricedNeedCount: priced,
      needLineCount: need.length,
      label: `Частично ${Math.round(sum)} ₽ · сумма неизвестна`,
    };
  }
  const asOf = need.map((l) => l.priceAsOf).filter(Boolean).sort().at(-1) ?? null;
  return {
    totalRub: sum,
    pricedNeedCount: priced,
    needLineCount: need.length,
    label: asOf
      ? `Оценка по прошлым покупкам · ${asOf}`
      : 'Оценка по вашим ценам',
  };
}
