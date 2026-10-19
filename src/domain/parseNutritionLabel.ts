/**
 * Deterministic nutrition-label text parser.
 * Never invents values: missing fields stay null. Unknown ≠ 0.
 */

export type ParsedNutritionLabel = {
  name: string | null;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  /** Which fields were found in text (for UI provenance). */
  foundFields: Array<'name' | 'energyKcal' | 'proteinG' | 'fatG' | 'carbG'>;
};

function finiteOrNull(n: number | null): number | null {
  if (n === null) return null;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseNumber(raw: string): number | null {
  const normalized = raw.replace(',', '.').replace(/\s/g, '');
  const v = Number(normalized);
  return finiteOrNull(Number.isFinite(v) ? v : null);
}

/** First capture group that parses as a non-negative finite number. */
function matchNumber(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const n = parseNumber(m[1]);
    if (n !== null) return n;
  }
  return null;
}

/**
 * Extract per-100g (or per stated basis) macros from RU/EN nutrition label OCR text.
 * Prefer explicit "/100" or "на 100" lines when present.
 */
export function parseNutritionLabelText(raw: string): ParsedNutritionLabel {
  const text = raw.replace(/\r/g, '\n').trim();
  const foundFields: ParsedNutritionLabel['foundFields'] = [];

  if (!text) {
    return {
      name: null,
      energyKcal: null,
      proteinG: null,
      fatG: null,
      carbG: null,
      foundFields,
    };
  }

  // Prefer a 100g block when OCR captured it.
  const per100Block =
    text.match(
      /(?:на\s*100\s*(?:г|g)|per\s*100\s*(?:g|г)|100\s*(?:г|g))([\s\S]{0,400})/i,
    )?.[1] ?? text;

  let energyKcal = matchNumber(per100Block, [
    /энергетическая\s*ценность[^0-9]{0,20}(\d+[.,]?\d*)\s*ккал/i,
    /калорийность[^0-9]{0,20}(\d+[.,]?\d*)\s*ккал/i,
    /energy[^0-9]{0,40}(\d+[.,]?\d*)\s*kcal/i,
    /(\d+[.,]?\d*)\s*ккал/i,
    /(\d+[.,]?\d*)\s*kcal/i,
  ]);

  // kJ → kcal only when kcal missing and kJ clearly labeled
  if (energyKcal === null) {
    const kj = matchNumber(per100Block, [
      /энергетическая\s*ценность[^0-9]{0,20}(\d+[.,]?\d*)\s*кдж/i,
      /(\d+[.,]?\d*)\s*кдж/i,
      /(\d+[.,]?\d*)\s*kj\b/i,
    ]);
    if (kj !== null) {
      energyKcal = Math.round((kj / 4.184) * 10) / 10;
    }
  }

  const proteinG = matchNumber(per100Block, [
    /белк[аи]?[^0-9]{0,12}(\d+[.,]?\d*)\s*г/i,
    /protein[s]?[^0-9]{0,12}(\d+[.,]?\d*)\s*g/i,
  ]);
  const fatG = matchNumber(per100Block, [
    /жир[ыа]?[^0-9]{0,12}(\d+[.,]?\d*)\s*г/i,
    /(?:total\s*)?fat[^0-9]{0,12}(\d+[.,]?\d*)\s*g/i,
  ]);
  const carbG = matchNumber(per100Block, [
    /углевод[ыа]?[^0-9]{0,12}(\d+[.,]?\d*)\s*г/i,
    /carbohydrate[s]?[^0-9]{0,12}(\d+[.,]?\d*)\s*g/i,
  ]);

  // Name: first non-empty line that doesn't look like a nutrition row
  let name: string | null = null;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.length < 2 || t.length > 80) continue;
    if (/^\d/.test(t)) continue;
    if (/(ккал|kcal|белок|жир|углевод|protein|fat|carb|энерг|nutrition|пищевая)/i.test(t)) {
      continue;
    }
    name = t;
    break;
  }

  if (name) foundFields.push('name');
  if (energyKcal !== null) foundFields.push('energyKcal');
  if (proteinG !== null) foundFields.push('proteinG');
  if (fatG !== null) foundFields.push('fatG');
  if (carbG !== null) foundFields.push('carbG');

  return {
    name,
    energyKcal,
    proteinG,
    fatG,
    carbG,
    foundFields,
  };
}
