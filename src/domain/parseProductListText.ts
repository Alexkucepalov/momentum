/**
 * Deterministic product-list-text → draft parser for «Мои продукты».
 * Never invents nutrition: macros stay null unless user explicitly fills them.
 * One product per line; strips list bullets/numbers.
 */

export type ParsedProductDraft = {
  displayName: string;
};

export type ParsedProductListText = {
  products: ParsedProductDraft[];
  /** Soft notes for UI — not errors. */
  warnings: string[];
};

function stripListPrefix(line: string): string {
  return line
    .replace(/^[\s•*\-–—]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

/**
 * Parse multi-line text of product names into draft products.
 * Empty/whitespace-only lines are skipped.
 * No nutrition extraction — macros stay null until user fills them.
 */
export function parseProductListText(text: string): ParsedProductListText {
  const lines = text.split('\n');
  const products: ParsedProductDraft[] = [];
  const warnings: string[] = [];
  let emptyLines = 0;

  for (const raw of lines) {
    const line = stripListPrefix(raw).trim();
    if (!line) {
      emptyLines++;
      continue;
    }

    // Skip common header patterns (with or without colon at end)
    const isHeader = /^(?:мои\s+)?(?:продукт(?:ы)?|список|my\s+products?|catalog)[\s:]*$/i.test(line);
    if (isHeader) {
      continue;
    }

    // Extract just the product name (everything before any separator like comma, dash, slash)
    // But keep compound names like "молоко 2.5%" intact
    let displayName = line;
    
    // Remove trailing metadata patterns (price, quantity, notes in parentheses)
    displayName = displayName
      .replace(/\s*[-–—]\s*\d+(?:[.,]\d+)?\s*(?:₽|руб|р\.?|rub)\s*$/i, '') // price at end
      .replace(/\s*\([^)]*\)\s*$/, '') // notes in parentheses at end
      .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*(?:₽|руб|р\.?|rub)\s*$/i, '') // price after comma
      .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*(?:г|г\.|кг|мл|л|шт\.?|штук)\s*$/i, '') // quantity after comma
      .trim();

    if (!displayName) {
      emptyLines++;
      continue;
    }

    // Deduplicate by normalized name (case-insensitive)
    const normalized = displayName.toLowerCase();
    const exists = products.some(p => p.displayName.toLowerCase() === normalized);
    if (!exists) {
      products.push({ displayName });
    }
  }

  if (products.length === 0 && emptyLines === lines.length) {
    warnings.push('Все строки пустые — нужны названия продуктов');
  }

  if (products.length === 0 && emptyLines < lines.length) {
    warnings.push('Не удалось распознать ни одного продукта');
  }

  return { products, warnings };
}
