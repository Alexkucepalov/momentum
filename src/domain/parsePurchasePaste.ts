/**
 * Deterministic order/receipt paste → draft lines.
 * Never invents quantities, prices, or nutrition (unknown ≠ 0 / null).
 */

import type { PantryUnit } from '../storage/types';

export type ParsedPurchaseLineDraft = {
  rawName: string;
  displayName: string;
  quantity: number | null;
  unit: PantryUnit | null;
  packageSizeText: string | null;
  unitPriceRub: number | null;
  lineTotalRub: number | null;
  discountRub: number | null;
  isFood: boolean;
  excluded: boolean;
};

export type ParsedPurchasePaste = {
  storeLabel: string | null;
  purchasedOn: string | null;
  totalRub: number | null;
  lines: ParsedPurchaseLineDraft[];
  warnings: string[];
  /** 0–1 rough signal from how many fields were filled; null if empty paste. */
  parseConfidence: number | null;
};

const NON_FOOD_RE =
  /пакет|пакеты|доставка|сервис|сборка|пакет\s*майка|пакет\s*бумаж|посуда|губки|салфетк|бытов|химия|моющее|средство|пакет\s*за\s*\d/i;

/** No \\b after Cyrillic — JS word boundaries ignore Cyrillic letters. */
const DISCOUNT_RE =
  /^(?:скидка|discount|промо|promo|купон|бонус)(?:\s|$|[—–\-:])/i;

const STORE_RE =
  /^(?:магазин|store|seller|продавец)\s*[:—-]?\s*(.+)$/i;
const DATE_RE =
  /^(?:дата|date|delivered|доставлен[оа]?)\s*[:—-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*$/i;
/** Total with optional amount — bare «Итого:» is meta, not a product. */
const TOTAL_RE =
  /^(?:итого|всего|total|сумма)\s*[:—-]?\s*(\d+[.,]?\d*)?\s*(?:₽|руб\.?|rub)?\s*$/i;

/** Optional approx marker before qty: «~0,85 кг». */
const QTY_NUM = '~?\\s*(\\d+[.,]?\\d*)';

const UNIT =
  '(?:грамм|гр|г|g|мл|ml|штук[аи]?|шт|pcs|pc|кг|kg|литр[а]?|л|l)';

function finiteOrNull(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseNumber(raw: string): number | null {
  const v = Number(raw.replace(/\s/g, '').replace(',', '.'));
  return finiteOrNull(Number.isFinite(v) ? v : null);
}

function normalizeDate(raw: string): string | null {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (!dmy) return null;
  const dd = dmy[1].padStart(2, '0');
  const mm = dmy[2].padStart(2, '0');
  let yyyy = dmy[3];
  if (yyyy.length === 2) yyyy = `20${yyyy}`;
  return `${yyyy}-${mm}-${dd}`;
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^[\s•*\-–—]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

function scaleQtyForUnit(qty: number, rawUnit: string): { quantity: number; unit: PantryUnit } | null {
  const t = rawUnit.toLowerCase();
  if (/^(?:кг|kg)$/.test(t)) return { quantity: qty * 1000, unit: 'g' };
  if (/^(?:л|l|литр[а]?)$/.test(t)) return { quantity: qty * 1000, unit: 'ml' };
  if (/^(?:г|g|гр|грамм)$/.test(t)) return { quantity: qty, unit: 'g' };
  if (/^(?:мл|ml)$/.test(t)) return { quantity: qty, unit: 'ml' };
  if (/^(?:шт|pcs|pc|штук[аи]?)$/.test(t)) return { quantity: qty, unit: 'pcs' };
  return null;
}

function applyQtyUnit(
  namePart: string,
  qtyRaw: string,
  unitRaw: string,
): { displayName: string; quantity: number; unit: PantryUnit; packageSizeText: string } | null {
  const q = parseNumber(qtyRaw);
  const scaled = q != null ? scaleQtyForUnit(q, unitRaw) : null;
  if (!scaled) return null;
  return {
    displayName: namePart.replace(/~\s*$/, '').replace(/\s{2,}/g, ' ').trim(),
    quantity: scaled.quantity,
    unit: scaled.unit,
    packageSizeText: `${qtyRaw.replace(/^\s*~\s*/, '~').trim()} ${unitRaw}`.replace(/^~~/, '~').trim(),
  };
}

/**
 * Parse one product line. Supported shapes (examples):
 * - Молоко 1 л — 89
 * - Хлеб 1 шт 45₽
 * - Курица ~0,85 кг 420
 * - Греческий йогурт 2 шт × 79
 * - Сыр 200 г · 250
 * - Пакет 5
 * - Творог — 120
 */
export function parsePurchaseLine(rawLine: string): ParsedPurchaseLineDraft | null {
  const line = stripListPrefix(rawLine);
  if (!line) return null;
  if (STORE_RE.test(line) || DATE_RE.test(line) || TOTAL_RE.test(line)) return null;
  if (DISCOUNT_RE.test(line)) return null;

  let working = line.replace(/\s*(?:₽|руб\.?|rub)\s*$/i, '').trim();
  let lineTotalRub: number | null = null;
  let unitPriceRub: number | null = null;
  let quantity: number | null = null;
  let unit: PantryUnit | null = null;
  let packageSizeText: string | null = null;

  // «Название 2 шт × 79»
  const mult = working.match(
    new RegExp(`^(.*?)(?:\\s+)${QTY_NUM}\\s*(${UNIT})\\s*[×xх]\\s*(\\d+[.,]?\\d*)\\s*$`, 'i'),
  );
  if (mult) {
    const applied = applyQtyUnit(mult[1], mult[2], mult[3]);
    const price = parseNumber(mult[4]);
    if (applied && price != null) {
      quantity = applied.quantity;
      unit = applied.unit;
      packageSizeText = applied.packageSizeText;
      unitPriceRub = price;
      lineTotalRub = applied.unit === 'pcs' ? price * applied.quantity : price;
      working = applied.displayName;
    }
  }

  // name + qty + unit + price: «Молоко 1 л — 89», «~0,85 кг 420»
  if (quantity == null) {
    const full = working.match(
      new RegExp(
        `^(.*?)(?:\\s+)${QTY_NUM}\\s*(${UNIT})(?:\\s*[—–\\-·|]?\\s*|\\s+)(\\d+[.,]?\\d*)\\s*$`,
        'i',
      ),
    );
    if (full) {
      const applied = applyQtyUnit(full[1], full[2], full[3]);
      const price = parseNumber(full[4]);
      if (applied && price != null) {
        quantity = applied.quantity;
        unit = applied.unit;
        packageSizeText = applied.packageSizeText;
        lineTotalRub = price;
        working = applied.displayName;
      }
    }
  }

  if (lineTotalRub == null) {
    const dashPrice = working.match(/^(.*?)(?:\s*[—–\-·|]\s+|\s+)(\d+[.,]?\d*)\s*$/);
    if (dashPrice) {
      const maybePrice = parseNumber(dashPrice[2]);
      const left = dashPrice[1].replace(/[—–\-·|]+\s*$/, '').trim();
      if (maybePrice != null && left.length >= 2) {
        lineTotalRub = maybePrice;
        working = left;
      }
    }
  }

  // Orphan dash after qty (unknown price): «Масло 180 г —»
  working = working.replace(/\s*[—–\-·|]+\s*$/, '').trim();

  if (quantity == null) {
    const qtyUnit = working.match(new RegExp(`^(.*?)(?:\\s+)${QTY_NUM}\\s*(${UNIT})\\s*$`, 'i'));
    if (qtyUnit) {
      const applied = applyQtyUnit(qtyUnit[1], qtyUnit[2], qtyUnit[3]);
      if (applied) {
        quantity = applied.quantity;
        unit = applied.unit;
        packageSizeText = applied.packageSizeText;
        working = applied.displayName;
      }
    }
  }

  const displayName = working.replace(/\s{2,}/g, ' ').trim();
  if (!displayName) return null;

  const isFood = !NON_FOOD_RE.test(displayName);

  return {
    rawName: line,
    displayName,
    quantity,
    unit,
    packageSizeText,
    unitPriceRub,
    lineTotalRub,
    discountRub: null,
    isFood,
    excluded: !isFood,
  };
}

export function parsePurchasePaste(raw: string): ParsedPurchasePaste {
  const warnings: string[] = [];
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) {
    return {
      storeLabel: null,
      purchasedOn: null,
      totalRub: null,
      lines: [],
      warnings: ['Пустой текст'],
      parseConfidence: null,
    };
  }

  let storeLabel: string | null = null;
  let purchasedOn: string | null = null;
  let totalRub: number | null = null;
  const lines: ParsedPurchaseLineDraft[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const storeM = line.match(STORE_RE);
    if (storeM) {
      storeLabel = storeM[1].trim() || null;
      continue;
    }
    const dateM = line.match(DATE_RE);
    if (dateM) {
      purchasedOn = normalizeDate(dateM[1]);
      if (!purchasedOn) warnings.push(`Не разобрана дата: ${dateM[1]}`);
      continue;
    }
    const totalM = line.match(TOTAL_RE);
    if (totalM) {
      if (totalM[1]) totalRub = parseNumber(totalM[1]);
      else warnings.push('Итого без суммы — totalRub остаётся неизвестным');
      continue;
    }
    if (DISCOUNT_RE.test(line)) {
      warnings.push(`Строка скидки пропущена (не позиция): ${line.slice(0, 48)}`);
      continue;
    }

    const parsed = parsePurchaseLine(line);
    if (!parsed) {
      warnings.push(`Пропущена строка: ${line.slice(0, 48)}`);
      continue;
    }
    lines.push(parsed);
  }

  if (lines.length === 0) warnings.push('Не найдено ни одной позиции');

  let filled = 0;
  let slots = 0;
  for (const l of lines) {
    slots += 3;
    if (l.quantity != null) filled += 1;
    if (l.unit != null) filled += 1;
    if (l.lineTotalRub != null) filled += 1;
  }
  const parseConfidence =
    lines.length === 0 ? null : Math.max(0, Math.min(1, filled / Math.max(slots, 1)));

  return { storeLabel, purchasedOn, totalRub, lines, warnings, parseConfidence };
}
