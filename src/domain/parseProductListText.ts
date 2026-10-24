/**
 * Paste → personal product names. Never invents nutrition:
 * macros stay null unless an explicit per-100g line is present.
 */

export type ParsedProductListItem = {
  name: string;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export type ParsedProductList = {
  items: ParsedProductListItem[];
  warnings: string[];
};

const HEADER_RE =
  /^(?:продукты|список|мои продукты|products?|grocery|купить)\s*:?\s*$/i;

/** Explicit per-100g only — avoids treating portion totals as per-100g. */
const PER_100G_MARK = /(?:\/\s*100\s*г|на\s*100\s*г|per\s*100\s*g)/i;

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

function parseMacrosIfPer100g(line: string): {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
} | null {
  if (!PER_100G_MARK.test(line)) return null;
  const kcalM = line.match(/(\d+[.,]?\d*)\s*ккал/i);
  const pM = line.match(/(?:^|[^\p{L}])[бb]\s*[:=]?\s*(\d+[.,]?\d*)/iu);
  const fM = line.match(/(?:^|[^\p{L}])[жf]\s*[:=]?\s*(\d+[.,]?\d*)/iu);
  const cM = line.match(/(?:^|[^\p{L}])[уuc]\s*[:=]?\s*(\d+[.,]?\d*)/iu);
  return {
    energyKcal: kcalM ? parseNumber(kcalM[1]!) : null,
    proteinG: pM ? parseNumber(pM[1]!) : null,
    fatG: fM ? parseNumber(fM[1]!) : null,
    carbG: cM ? parseNumber(cM[1]!) : null,
  };
}

function nameFromLine(line: string): string {
  let name = line
    .replace(PER_100G_MARK, ' ')
    .replace(/\d+[.,]?\d*\s*ккал/gi, ' ')
    .replace(/(?:^|[^\p{L}])[бжфуbfuc]\s*[:=]?\s*\d+[.,]?\d*/giu, ' ')
    .replace(/[·|]+/g, ' ')
    .replace(/\s*[—–-]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Drop trailing separators left after macro strip
  name = name.replace(/\s*[—–,:;]\s*$/g, '').trim();
  return name;
}

/**
 * One name per non-empty line. Optional КБЖУ only with «/100г» or «на 100 г».
 */
export function parseProductListText(raw: string): ParsedProductList {
  const warnings: string[] = [];
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) {
    return { items: [], warnings: ['Пустой текст'] };
  }

  const seen = new Set<string>();
  const items: ParsedProductListItem[] = [];

  for (const rawLine of text.split('\n')) {
    const line = stripListPrefix(rawLine);
    if (!line) continue;
    if (HEADER_RE.test(line)) continue;

    const macros = parseMacrosIfPer100g(line);
    const name = nameFromLine(line);
    if (!name || name.length < 2) {
      warnings.push(`Пропущена строка: «${line.slice(0, 40)}»`);
      continue;
    }

    const key = name.toLocaleLowerCase('ru');
    if (seen.has(key)) {
      warnings.push(`Дубликат: ${name}`);
      continue;
    }
    seen.add(key);

    items.push({
      name,
      energyKcal: macros?.energyKcal ?? null,
      proteinG: macros?.proteinG ?? null,
      fatG: macros?.fatG ?? null,
      carbG: macros?.carbG ?? null,
    });
  }

  if (items.length === 0) {
    warnings.push('Не удалось найти названия продуктов');
  }

  return { items, warnings };
}
