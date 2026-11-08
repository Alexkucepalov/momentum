export type FoodExpenseCategory = 'groceries' | 'cafe' | 'office' | 'delivery';

export type MonthBudgetSnapshot = {
  month: string; // YYYY-MM
  limitRub: number | null;
  spentRub: number | null;
  remainingRub: number | null;
  /** Projected month-end spend; null if cannot forecast honestly. */
  forecastRub: number | null;
  daysElapsed: number;
  daysInMonth: number;
  incomplete: boolean;
};

function assertNonNeg(n: number, label: string): void {
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${label}`);
}

/** Local calendar month key from YYYY-MM-DD. */
export function monthKeyFromDateLocal(dateLocal: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLocal)) throw new Error('Invalid dateLocal');
  return dateLocal.slice(0, 7);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) throw new Error('Invalid month');
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 1-based day of month from YYYY-MM-DD. */
export function dayOfMonth(dateLocal: string): number {
  const d = Number(dateLocal.slice(8, 10));
  if (!Number.isInteger(d) || d < 1 || d > 31) throw new Error('Invalid day');
  return d;
}

/**
 * Sum known expense amounts. If any amount is null/invalid → incomplete (not treated as 0).
 */
export function sumKnownExpenses(
  amounts: Array<number | null>,
): { total: number | null; incomplete: boolean } {
  let total = 0;
  let any = false;
  for (const a of amounts) {
    if (a === null) return { total: null, incomplete: true };
    assertNonNeg(a, 'amount');
    total += a;
    any = true;
  }
  if (!any) return { total: 0, incomplete: false };
  return { total, incomplete: false };
}

/** Minimum elapsed days before a linear month-end forecast is honest enough to show. */
export const FORECAST_MIN_DAYS_ELAPSED = 7;

/**
 * Linear forecast to month end from known spent so far.
 * Needs positive spent, enough elapsed days, and at least one expense row.
 * Never invents spend. Empty month → null (UI: «Недостаточно данных», not «≈0 ₽»).
 */
export function forecastMonthSpend(args: {
  spentRub: number | null;
  daysElapsed: number;
  daysInMonth: number;
  minDaysElapsed?: number;
  /** When 0 / omitted, there is nothing to extrapolate. */
  expenseCount?: number;
}): number | null {
  const { spentRub, daysElapsed, daysInMonth: dim } = args;
  const minDays = args.minDaysElapsed ?? FORECAST_MIN_DAYS_ELAPSED;
  const expenseCount = args.expenseCount ?? (spentRub != null && spentRub > 0 ? 1 : 0);
  if (expenseCount < 1) return null;
  if (spentRub === null || !Number.isFinite(spentRub) || spentRub <= 0) return null;
  if (!Number.isInteger(daysElapsed) || daysElapsed < 1) return null;
  if (!Number.isInteger(dim) || dim < 1) return null;
  if (daysElapsed < minDays) return null;
  return (spentRub / daysElapsed) * dim;
}

export function buildMonthBudgetSnapshot(args: {
  month: string;
  limitRub: number | null;
  expenseAmounts: Array<number | null>;
  asOfDateLocal: string;
}): MonthBudgetSnapshot {
  const dim = daysInMonth(args.month);
  const day = monthKeyFromDateLocal(args.asOfDateLocal) === args.month ? dayOfMonth(args.asOfDateLocal) : dim;
  const { total: spentRub, incomplete } = sumKnownExpenses(args.expenseAmounts);
  const remainingRub =
    args.limitRub !== null && spentRub !== null ? args.limitRub - spentRub : null;
  const forecastRub = forecastMonthSpend({
    spentRub,
    daysElapsed: Math.min(day, dim),
    daysInMonth: dim,
    expenseCount: args.expenseAmounts.length,
  });
  return {
    month: args.month,
    limitRub: args.limitRub,
    spentRub,
    remainingRub,
    forecastRub,
    daysElapsed: Math.min(day, dim),
    daysInMonth: dim,
    incomplete: incomplete || args.limitRub === null,
  };
}

/**
 * Estimate cost of eaten grams when price for key is known (per unit mass).
 * priceRub is for `pricePerUnit` grams (e.g. 1000 for per-kg). Returns null if unknown.
 */
export function estimateEatenCostRub(args: {
  grams: number;
  priceRub: number | null;
  pricePerUnitG: number;
}): number | null {
  assertNonNeg(args.grams, 'grams');
  if (args.priceRub === null || !Number.isFinite(args.priceRub)) return null;
  assertNonNeg(args.priceRub, 'priceRub');
  if (!Number.isFinite(args.pricePerUnitG) || args.pricePerUnitG <= 0) {
    throw new Error('Invalid pricePerUnitG');
  }
  return (args.grams / args.pricePerUnitG) * args.priceRub;
}

export function sumEatenCost(estimates: Array<number | null>): {
  /** Full month total only when every estimate is known; else null. */
  total: number | null;
  /** Sum of known estimates (may be partial). null if none known. */
  knownSum: number | null;
  knownCount: number;
  totalCount: number;
  incomplete: boolean;
} {
  let knownSum = 0;
  let known = 0;
  for (const e of estimates) {
    if (e === null) continue;
    assertNonNeg(e, 'estimate');
    knownSum += e;
    known += 1;
  }
  const totalCount = estimates.length;
  const incomplete = known < totalCount || totalCount === 0;
  if (known === 0) {
    return { total: null, knownSum: null, knownCount: 0, totalCount, incomplete: true };
  }
  return {
    total: incomplete ? null : knownSum,
    knownSum,
    knownCount: known,
    totalCount,
    incomplete,
  };
}
