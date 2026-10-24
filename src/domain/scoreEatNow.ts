import { portion, validateNutrition, type Nutrition } from './nutrition';
import {
  hasAnyKnownRemaining,
  type MacroFour,
  type MacroRemaining,
} from './remainingMacros';

export type EatNowFilterId =
  | 'all'
  | 'no_cook'
  | 'quick_15'
  | 'more_protein';

export type EatNowSourceKind = 'recipe' | 'product' | 'cooked_batch' | 'combo';

export type EatNowCandidateInput = {
  id: string;
  kind: EatNowSourceKind;
  title: string;
  /** Nutrition per 100 g of the edible item. */
  per100: Nutrition;
  prepMinutes: number | null;
  /** True when pantry / leftovers imply available without shopping. */
  atHome: boolean;
  /** True when suggestion may require a store run (catalog / not in pantry). */
  toBuy?: boolean;
  /** 0..1 ingredient pantry coverage; null if unknown / N/A. */
  pantryRatio?: number | null;
  /** Short RU hint e.g. «3/5 дома». */
  coverageHint?: string | null;
};

export type EatNowCandidate = {
  id: string;
  kind: EatNowSourceKind;
  title: string;
  suggestedGrams: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  prepMinutes: number | null;
  filtersMatched: EatNowFilterId[];
  /** null when macros cannot score against remaining. */
  fitScore: number | null;
  explanation: string;
};

const MIN_G = 40;
const MAX_G = 500;
const DEFAULT_G = 150;
/** One sitting — never treat the whole day's remaining as a single portion. */
const MEAL_ENERGY_CAP_KCAL = 700;
const MEAL_PROTEIN_CAP_G = 50;
const MEAL_DAY_FRACTION = 0.35;

/** Energy budget for one Eat Now suggestion (deterministic). */
export function mealEnergyBudgetKcal(remainingKcal: number): number {
  if (!Number.isFinite(remainingKcal)) return DEFAULT_G;
  if (remainingKcal <= 0) return 80;
  if (remainingKcal <= MEAL_ENERGY_CAP_KCAL) return remainingKcal;
  return Math.min(MEAL_ENERGY_CAP_KCAL, Math.round(remainingKcal * MEAL_DAY_FRACTION));
}

export function mealProteinBudgetG(remainingProteinG: number): number {
  if (!Number.isFinite(remainingProteinG)) return 25;
  if (remainingProteinG <= 0) return 15;
  if (remainingProteinG <= MEAL_PROTEIN_CAP_G) return remainingProteinG;
  return Math.min(MEAL_PROTEIN_CAP_G, Math.round(remainingProteinG * MEAL_DAY_FRACTION));
}

function finiteNonNeg(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

function nutritionToMacros(n: Nutrition): MacroFour {
  return {
    energyKcal: n.kcal,
    proteinG: n.protein,
    fatG: n.fat,
    carbG: n.carbs,
  };
}

function hasAnyKnownMacro(n: Nutrition): boolean {
  return n.kcal !== null || n.protein !== null || n.fat !== null || n.carbs !== null;
}

/**
 * Suggest portion grams under remaining energy when both known.
 * Falls back to protein-guided or default. Rejects invalid grams.
 * Overshoot remaining is allowed (soft guidance).
 */
export function suggestEatNowPortionGrams(
  per100: Nutrition,
  remaining: MacroFour,
  opts?: { preferProtein?: boolean },
): number {
  validateNutrition(per100);
  const preferProtein = opts?.preferProtein === true;

  if (preferProtein && remaining.proteinG !== null && per100.protein !== null && per100.protein > 0) {
    const targetP = mealProteinBudgetG(remaining.proteinG);
    const g = (targetP / per100.protein) * 100;
    return clampGrams(g);
  }

  if (remaining.energyKcal !== null && per100.kcal !== null && per100.kcal > 0) {
    if (remaining.energyKcal <= 0) return clampGrams(80);
    const targetKcal = mealEnergyBudgetKcal(remaining.energyKcal);
    const g = (targetKcal / per100.kcal) * 100;
    return clampGrams(g);
  }

  if (remaining.proteinG !== null && per100.protein !== null && per100.protein > 0) {
    const targetP = mealProteinBudgetG(remaining.proteinG);
    const g = (targetP / per100.protein) * 100;
    return clampGrams(g);
  }

  return DEFAULT_G;
}

function clampGrams(g: number): number {
  if (!finiteNonNeg(g)) throw new Error('Invalid grams');
  const rounded = Math.round(g);
  return Math.min(MAX_G, Math.max(MIN_G, rounded));
}

/**
 * Soft fit 0..1 (higher = better). null if cannot compare any shared known field.
 * Exceeding remaining reduces score but does not null it (not a ban).
 */
export function computeFitScore(portionMacros: MacroFour, remaining: MacroFour): number | null {
  const dims: Array<{ p: number | null; r: number | null; weight: number }> = [
    { p: portionMacros.energyKcal, r: remaining.energyKcal, weight: 1 },
    { p: portionMacros.proteinG, r: remaining.proteinG, weight: 1.2 },
    { p: portionMacros.fatG, r: remaining.fatG, weight: 0.6 },
    { p: portionMacros.carbG, r: remaining.carbG, weight: 0.6 },
  ];

  let weighted = 0;
  let totalW = 0;
  for (const { p, r, weight } of dims) {
    if (p === null || r === null || !Number.isFinite(p) || !Number.isFinite(r)) continue;
    const denom = Math.max(Math.abs(r), 1);
    const overshootPenalty = p > r && r >= 0 ? 0.35 : 0;
    const closeness = 1 - Math.min(1, Math.abs(p - Math.max(r, 0)) / denom);
    weighted += weight * Math.max(0, closeness - overshootPenalty);
    totalW += weight;
  }
  if (totalW === 0) return null;
  return weighted / totalW;
}

function matchesFilters(
  input: EatNowCandidateInput,
  filters: EatNowFilterId[],
): { ok: boolean; matched: EatNowFilterId[] } {
  const active = filters.filter((f) => f !== 'all');
  if (active.length === 0) return { ok: true, matched: ['all'] };

  const matched: EatNowFilterId[] = [];
  for (const f of active) {
    if (f === 'no_cook') {
      if (input.prepMinutes === null || input.prepMinutes > 5) return { ok: false, matched };
      matched.push(f);
    } else if (f === 'quick_15') {
      if (input.prepMinutes === null || input.prepMinutes > 15) return { ok: false, matched };
      matched.push(f);
    } else if (f === 'more_protein') {
      matched.push(f);
    }
  }
  return { ok: true, matched };
}

function explanationFor(
  input: EatNowCandidateInput,
  matched: EatNowFilterId[],
  fitScore: number | null,
  portion: MacroFour,
  remaining: MacroFour,
): string {
  const parts: string[] = [];
  if (matched.includes('no_cook')) {
    parts.push('Без готовки');
  } else if (matched.includes('quick_15') || (input.prepMinutes !== null && input.prepMinutes <= 15)) {
    parts.push('Быстрый вариант');
  } else if (matched.includes('more_protein')) {
    parts.push('С акцентом на белок');
  } else if (fitScore !== null && fitScore >= 0.7) {
    parts.push('Хорошо ложится в остаток');
  } else if (input.kind === 'recipe') {
    parts.push('Из ваших рецептов');
  } else if (input.kind === 'cooked_batch') {
    parts.push('Готовая партия');
  } else {
    parts.push('Из продуктов');
  }

  if (portion.energyKcal !== null && remaining.energyKcal !== null) {
    if (remaining.energyKcal > 0 && portion.energyKcal > remaining.energyKcal) {
      parts.push(`порция ~${Math.round(portion.energyKcal)} ккал > остатка ${Math.round(remaining.energyKcal)}`);
    } else if (remaining.energyKcal > MEAL_ENERGY_CAP_KCAL) {
      parts.push(`порция на приём ~${Math.round(portion.energyKcal)} ккал`);
    }
  }
  return parts.join(' · ');
}

/**
 * Rank Eat Now candidates. Excludes items with fully unknown nutrition.
 * Does not ban food when remaining is negative or incomplete.
 */
export function scoreEatNow(
  candidates: EatNowCandidateInput[],
  remaining: MacroRemaining | MacroFour,
  filters: EatNowFilterId[] = ['all'],
): EatNowCandidate[] {
  const preferProtein = filters.includes('more_protein');
  const out: EatNowCandidate[] = [];

  for (const c of candidates) {
    if (!hasAnyKnownMacro(c.per100)) continue;
    const { ok, matched } = matchesFilters(c, filters);
    if (!ok) continue;

    let suggestedGrams: number;
    try {
      suggestedGrams = suggestEatNowPortionGrams(c.per100, remaining, { preferProtein });
    } catch {
      continue;
    }

    let n: Nutrition;
    try {
      n = portion(c.per100, suggestedGrams);
    } catch {
      continue;
    }

    const macros = nutritionToMacros(n);
    const fitScore = hasAnyKnownRemaining(remaining)
      ? computeFitScore(macros, remaining)
      : null;

    out.push({
      id: c.id,
      kind: c.kind,
      title: c.title,
      suggestedGrams,
      energyKcal: macros.energyKcal,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      carbG: macros.carbG,
      prepMinutes: c.prepMinutes,
      filtersMatched: matched,
      fitScore,
      explanation: explanationFor(c, matched, fitScore, macros, remaining),
    });
  }

  const ratioById = new Map(
    candidates.map((c) => [`${c.kind}:${c.id}`, c.pantryRatio ?? null] as const),
  );

  out.sort((a, b) => {
    if (preferProtein) {
      const pa = a.proteinG;
      const pb = b.proteinG;
      if (pa !== null && pb !== null && pa !== pb) return pb - pa;
      if (pa !== null && pb === null) return -1;
      if (pa === null && pb !== null) return 1;
    }
    const sa = a.fitScore;
    const sb = b.fitScore;
    if (sa !== null && sb !== null && sa !== sb) return sb - sa;
    if (sa !== null && sb === null) return -1;
    if (sa === null && sb !== null) return 1;
    const ra = ratioById.get(`${a.kind}:${a.id}`);
    const rb = ratioById.get(`${b.kind}:${b.id}`);
    if (ra !== null && ra !== undefined && rb !== null && rb !== undefined && ra !== rb) {
      return rb - ra;
    }
    if (ra != null && rb == null) return -1;
    if (ra == null && rb != null) return 1;
    return a.title.localeCompare(b.title, 'ru');
  });

  return out;
}
