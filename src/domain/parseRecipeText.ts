/**
 * Deterministic recipe-text → draft parser (Phase 0 Smart Recipe Import).
 * Never invents nutrition: macros stay null unless explicitly present in text.
 * Grams stay null when not recognized (unknown ≠ 0).
 * Diary-style pastes: ingredient line + following «N ккал · Б …» are paired;
 * portion macros are converted to per-100 g when mass is known.
 */

export type ParsedRecipeIngredient = {
  displayName: string;
  rawGrams: number | null;
  energyKcalPer100g: number | null;
  proteinGPer100g: number | null;
  fatGPer100g: number | null;
  carbGPer100g: number | null;
};

export type ParsedRecipeText = {
  name: string | null;
  cookedYieldG: number | null;
  description: string | null;
  instructions: string | null;
  ingredients: ParsedRecipeIngredient[];
  /** Soft notes for UI — not errors. */
  warnings: string[];
};

type MacroAmounts = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

const INGREDIENT_HEADER =
  /^(?:ингредиент(?:ы|ов)?|состав|products?|ingredients?)\s*:?\s*$/i;
const INSTRUCTION_HEADER =
  /^(?:приготовление|способ(?:\s+приготовления)?|инструкци[яи]|шаги|preparation|instructions?|directions?|method)\s*:?\s*$/i;
/** Yield / total mass — includes chat «Итого на весь контейнер — 490 г». */
const YIELD_RE =
  /(?:выход(?:\s+готового)?|готового(?:\s+блюда)?|итого|всего|сумма|total|yield|serves?)[^0-9]{0,48}(\d+[.,]?\d*)\s*(?:г|g|гр|грамм)?/i;
/** No \\b after Cyrillic «г» — JS word boundaries ignore Cyrillic letters. */
const GRAMS_RE = /(\d+[.,]?\d*)\s*(?:грамм|гр|г|g)(?=\s|$|[.,;:)\]])/i;

function finiteOrNull(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseNumber(raw: string): number | null {
  const v = Number(raw.replace(',', '.').replace(/\s/g, ''));
  return finiteOrNull(Number.isFinite(v) ? v : null);
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^[\s•*\-–—]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

function matchLabeledNumber(text: string, labels: string[]): number | null {
  for (const label of labels) {
    const re = new RegExp(
      `${label}\\s*[:=]?\\s*(\\d+[.,]?\\d*)\\s*(?:г|g)?`,
      'i',
    );
    const m = text.match(re);
    if (m?.[1]) {
      const n = parseNumber(m[1]);
      if (n !== null) return n;
    }
  }
  return null;
}

/** RU diary abbrev: «Б 55,8 г», «· Ж 6,5 г» — avoid bare-letter false positives. */
function matchAbbrevGram(text: string, letter: 'Б' | 'Ж' | 'У'): number | null {
  const re = new RegExp(
    `(?:^|[·•|,;/(]|\\s)${letter}\\s*[:=]?\\s*(\\d+[.,]?\\d*)\\s*(?:г|g)?`,
    'i',
  );
  const m = text.match(re);
  return m?.[1] ? parseNumber(m[1]) : null;
}

function extractMacroAmounts(line: string): MacroAmounts {
  const energy =
    matchLabeledNumber(line, ['ккал', 'kcal', 'калорийность']) ??
    (() => {
      const m = line.match(/(\d+[.,]?\d*)\s*(?:ккал|kcal)/i);
      return m?.[1] ? parseNumber(m[1]) : null;
    })();

  return {
    energyKcal: energy,
    proteinG:
      matchLabeledNumber(line, ['белк[аи]', 'protein']) ?? matchAbbrevGram(line, 'Б'),
    fatG: matchLabeledNumber(line, ['жир(?:ы|а)?', 'fat']) ?? matchAbbrevGram(line, 'Ж'),
    carbG:
      matchLabeledNumber(line, ['углевод(?:ы|ов)?', 'carb(?:s|ohydrates)?']) ??
      matchAbbrevGram(line, 'У'),
  };
}

function stripMacroFragments(text: string): string {
  return text
    .replace(/\d+[.,]?\d*\s*(?:ккал|kcal)/gi, ' ')
    .replace(/(?:ккал|kcal|калорийность)\s*[:=]?\s*\d+[.,]?\d*/gi, ' ')
    .replace(
      /(?:белк[аи]|жир(?:ы|а)?|углевод(?:ы|ов)?|protein|fat|carb(?:s|ohydrates)?)\s*[:=]?\s*\d+[.,]?\d*\s*(?:г|g)?/gi,
      ' ',
    )
    .replace(/(?:^|[·•|,;/(]|\s)[БЖУ]\s*[:=]?\s*\d+[.,]?\d*\s*(?:г|g)?/gi, ' ')
    .replace(/[·•]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Diary nutrition row: «297 ккал · Б 55,8 г · Ж 6,5 г · У 0 г»
 * — not an ingredient name.
 */
export function isMacroSummaryLine(rawLine: string): boolean {
  const line = stripListPrefix(rawLine);
  if (!line) return false;

  const hasEnergy =
    /\d+[.,]?\d*\s*(?:ккал|kcal)/i.test(line) ||
    /(?:ккал|kcal|калорийность)\s*[:=]?\s*\d+/i.test(line);
  const hasAbbrev = /(?:^|[·•|,;/(]|\s)[БЖУ]\s*[:=]?\s*\d+/i.test(line);
  const hasWordMacro =
    /(?:белк[аи]|жир(?:ы|а)?|углевод(?:ы|ов)?|protein|fat|carb)/i.test(line);

  if (!hasEnergy && !hasAbbrev && !hasWordMacro) return false;

  // «297 ккал …» always a summary row
  if (/^\d+[.,]?\d*\s*(?:ккал|kcal)/i.test(line)) return true;

  const leftover = stripMacroFragments(line);
  // Little/no food name left after stripping macros
  if (!leftover) return true;
  if (leftover.length <= 3 && hasEnergy) return true;

  return false;
}

export function isTotalOrYieldLine(rawLine: string): boolean {
  const line = stripListPrefix(rawLine);
  if (!line) return false;
  if (/^(?:итого|всего|сумма|total|выход)\b/i.test(line)) return true;
  return YIELD_RE.test(line);
}

function extractYieldGrams(line: string): number | null {
  const m = line.match(YIELD_RE);
  if (!m?.[1]) return null;
  const y = parseNumber(m[1]);
  return y != null && y > 0 ? y : null;
}

function toPer100(portion: number, grams: number, kind: 'kcal' | 'macro'): number {
  const raw = (portion * 100) / grams;
  if (kind === 'kcal') return Math.round(raw);
  return Math.round(raw * 10) / 10;
}

function applyPortionMacros(
  target: ParsedRecipeIngredient,
  amounts: MacroAmounts,
  alreadyPer100: boolean,
): void {
  const g = target.rawGrams;
  const convert = (v: number | null, kind: 'kcal' | 'macro'): number | null => {
    if (v == null) return null;
    if (alreadyPer100) return finiteOrNull(v);
    if (g == null || g <= 0) return null;
    return finiteOrNull(toPer100(v, g, kind));
  };

  if (target.energyKcalPer100g == null) {
    target.energyKcalPer100g = convert(amounts.energyKcal, 'kcal');
  }
  if (target.proteinGPer100g == null) {
    target.proteinGPer100g = convert(amounts.proteinG, 'macro');
  }
  if (target.fatGPer100g == null) {
    target.fatGPer100g = convert(amounts.fatG, 'macro');
  }
  if (target.carbGPer100g == null) {
    target.carbGPer100g = convert(amounts.carbG, 'macro');
  }
}

/**
 * Parse one ingredient line. Returns null if line is not ingredient-like.
 */
export function parseIngredientLine(rawLine: string): ParsedRecipeIngredient | null {
  const line = stripListPrefix(rawLine);
  if (!line) return null;
  if (INGREDIENT_HEADER.test(line) || INSTRUCTION_HEADER.test(line)) return null;
  if (isMacroSummaryLine(line)) return null;
  if (isTotalOrYieldLine(line)) return null;

  const amounts = extractMacroAmounts(line);
  const alreadyPer100 = /на\s*100\s*г/i.test(line);
  const gramsMatch = line.match(GRAMS_RE);
  const rawGrams = gramsMatch?.[1] ? parseNumber(gramsMatch[1]) : null;

  let displayName = line;
  if (gramsMatch) {
    displayName = line
      .replace(GRAMS_RE, ' ')
      .replace(/\s*[—–\-:]\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  displayName = stripMacroFragments(displayName);
  if (!displayName && rawGrams == null) return null;
  if (!displayName) displayName = line;

  const ing: ParsedRecipeIngredient = {
    displayName,
    rawGrams,
    energyKcalPer100g: null,
    proteinGPer100g: null,
    fatGPer100g: null,
    carbGPer100g: null,
  };

  // Inline macros on the same line: treat as per-100 g only when labeled, else as portion.
  if (
    amounts.energyKcal != null ||
    amounts.proteinG != null ||
    amounts.fatG != null ||
    amounts.carbG != null
  ) {
    applyPortionMacros(ing, amounts, alreadyPer100 || rawGrams == null);
  }

  return ing;
}

type Section = 'preamble' | 'ingredients' | 'instructions';

/**
 * Build a recipe draft from free-form RU/EN recipe text.
 * Does not call network or invent nutrients.
 */
export function parseRecipeText(raw: string): ParsedRecipeText {
  const warnings: string[] = [];
  const text = raw.replace(/\r/g, '\n').trim();
  if (!text) {
    return {
      name: null,
      cookedYieldG: null,
      description: null,
      instructions: null,
      ingredients: [],
      warnings: ['Пустой текст'],
    };
  }

  const lines = text.split('\n').map((l) => l.trimEnd());
  let section: Section = 'preamble';
  const preamble: string[] = [];
  const bodyLines: string[] = [];
  const instructionLines: string[] = [];
  let cookedYieldG: number | null = null;
  let sawIngredientHeader = false;
  /** Drop the KBJU row that follows «Итого … г» (recipe total, not a product). */
  let skipFollowingRecipeTotalMacro = false;

  for (const original of lines) {
    const line = original.trim();
    if (!line) {
      if (section === 'instructions') instructionLines.push('');
      continue;
    }

    if (skipFollowingRecipeTotalMacro && isMacroSummaryLine(line)) {
      skipFollowingRecipeTotalMacro = false;
      continue;
    }
    skipFollowingRecipeTotalMacro = false;

    if (INGREDIENT_HEADER.test(line)) {
      section = 'ingredients';
      sawIngredientHeader = true;
      continue;
    }
    if (INSTRUCTION_HEADER.test(line)) {
      section = 'instructions';
      continue;
    }

    if (isTotalOrYieldLine(line) && section !== 'instructions') {
      const y = extractYieldGrams(line);
      if (y != null) cookedYieldG = y;
      skipFollowingRecipeTotalMacro = true;
      continue;
    }

    if (section === 'ingredients') {
      bodyLines.push(line);
      continue;
    }
    if (section === 'instructions') {
      instructionLines.push(line);
      continue;
    }

    // Preamble: first gram/macro/ingredient-looking line starts the body
    if (
      !sawIngredientHeader &&
      (isMacroSummaryLine(line) ||
        (parseIngredientLine(line)?.rawGrams != null))
    ) {
      section = 'ingredients';
      bodyLines.push(line);
      continue;
    }
    preamble.push(line);
  }

  // Fallback: no body yet — scan all non-instruction lines
  if (bodyLines.length === 0) {
    let skipMacro = false;
    for (const line of lines) {
      const t = line.trim();
      if (!t || INSTRUCTION_HEADER.test(t) || INGREDIENT_HEADER.test(t)) continue;
      if (skipMacro && isMacroSummaryLine(t)) {
        skipMacro = false;
        continue;
      }
      skipMacro = false;
      if (isTotalOrYieldLine(t)) {
        const y = extractYieldGrams(t);
        if (y != null) cookedYieldG = y;
        skipMacro = true;
        continue;
      }
      if (isMacroSummaryLine(t) || parseIngredientLine(t)?.rawGrams != null) {
        bodyLines.push(t);
      } else if (/^[-•*]/.test(t) || /^\d+[.)]/.test(t)) {
        const ing = parseIngredientLine(t);
        if (ing) bodyLines.push(t);
      }
    }
  }

  const ingredients: ParsedRecipeIngredient[] = [];
  /** After «Итого … г» the next KBJU row is recipe total — not a product. */
  let skipNextMacroAsRecipeTotal = false;
  for (const line of bodyLines) {
    if (isTotalOrYieldLine(line)) {
      const y = extractYieldGrams(line);
      if (y != null) cookedYieldG = y;
      skipNextMacroAsRecipeTotal = true;
      continue;
    }
    if (isMacroSummaryLine(line)) {
      if (skipNextMacroAsRecipeTotal) {
        skipNextMacroAsRecipeTotal = false;
        continue;
      }
      const last = ingredients[ingredients.length - 1];
      if (last) {
        const alreadyPer100 = /на\s*100\s*г/i.test(line);
        applyPortionMacros(last, extractMacroAmounts(line), alreadyPer100);
      }
      continue;
    }
    skipNextMacroAsRecipeTotal = false;
    const ing = parseIngredientLine(line);
    if (ing) ingredients.push(ing);
  }

  const name = preamble[0]?.trim() || null;
  const descriptionParts = preamble.slice(1).map((l) => l.trim()).filter(Boolean);
  const description = descriptionParts.length ? descriptionParts.join('\n') : null;
  const instructions = instructionLines.join('\n').trim() || null;

  const missingGrams = ingredients.filter((i) => i.rawGrams == null).length;
  if (ingredients.length === 0) {
    warnings.push('Ингредиенты не распознаны — заполни вручную');
  } else if (missingGrams > 0) {
    warnings.push(`У ${missingGrams} поз. граммы не распознаны — проверь`);
  }
  if (cookedYieldG == null) {
    warnings.push('Выход готового блюда не найден — укажи сам');
  }

  return {
    name,
    cookedYieldG,
    description,
    instructions,
    ingredients,
    warnings,
  };
}
