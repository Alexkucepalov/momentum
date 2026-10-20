/**
 * Pure helpers for purchase fingerprinting and confirm gates.
 * Pantry / expense writes happen only in the repository after these checks.
 */

import type { PurchaseStatus } from '../storage/types';

export type PurchaseFingerprintInput = {
  storeLabel: string | null;
  purchasedOn: string;
  totalRub: number | null;
  lines: Array<{
    displayName: string;
    quantity: number | null;
    unit: string | null;
    lineTotalRub: number | null;
    excluded: boolean;
  }>;
};

/** Statuses that may apply pantry + expense after explicit user confirm. */
export function isConfirmablePurchaseStatus(status: PurchaseStatus): boolean {
  return status === 'delivered' || status === 'fiscal_receipt';
}

export function normalizePurchaseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stable fingerprint for duplicate detection.
 * Does not use crypto — deterministic string hash suitable for local dedupe.
 */
export function purchaseFingerprint(input: PurchaseFingerprintInput): string {
  const parts = [
    (input.storeLabel ?? '').trim().toLowerCase(),
    input.purchasedOn,
    input.totalRub == null ? '' : String(input.totalRub),
    String(input.lines.length),
  ];
  const lineKeys = input.lines
    .map((l) =>
      [
        normalizePurchaseName(l.displayName),
        l.quantity == null ? '' : String(l.quantity),
        l.unit ?? '',
        l.lineTotalRub == null ? '' : String(l.lineTotalRub),
        l.excluded ? '1' : '0',
      ].join(':'),
    )
    .sort();
  const raw = `${parts.join('|')}#${lineKeys.join(';')}`;
  return `fp_${fnv1a(raw)}`;
}

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Sum line totals for non-excluded lines; null if none known (unknown ≠ 0). */
export function sumKnownPurchaseLineTotals(
  lines: Array<{ lineTotalRub: number | null; excluded: boolean }>,
): number | null {
  let sum = 0;
  let known = 0;
  for (const l of lines) {
    if (l.excluded) continue;
    if (l.lineTotalRub == null || !Number.isFinite(l.lineTotalRub) || l.lineTotalRub < 0) continue;
    sum += l.lineTotalRub;
    known += 1;
  }
  return known === 0 ? null : sum;
}

/**
 * Expense amount for a confirmed purchase.
 * Prefer explicit order total. Otherwise sum lines only when **every** non-excluded
 * line has a known total — never invent a “complete” sum from partial prices.
 */
export function resolveExpenseAmountRub(args: {
  totalRub: number | null;
  lines: Array<{ lineTotalRub: number | null; excluded: boolean }>;
}): number | null {
  if (args.totalRub != null && Number.isFinite(args.totalRub) && args.totalRub >= 0) {
    return args.totalRub;
  }
  const active = args.lines.filter((l) => !l.excluded);
  if (active.length === 0) return null;
  let sum = 0;
  for (const l of active) {
    if (l.lineTotalRub == null || !Number.isFinite(l.lineTotalRub) || l.lineTotalRub < 0) {
      return null;
    }
    sum += l.lineTotalRub;
  }
  return sum;
}

export type PantryApplyLine = {
  displayName: string;
  quantity: number | null;
  unit: 'g' | 'ml' | 'pcs' | null;
  isFood: boolean;
  excluded: boolean;
};

/** Lines that should create pantry stock on confirm. */
export function linesForPantryApply(lines: PantryApplyLine[]): PantryApplyLine[] {
  return lines.filter((l) => !l.excluded && l.isFood && l.displayName.trim().length > 0);
}
