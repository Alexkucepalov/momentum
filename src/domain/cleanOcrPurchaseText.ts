/**
 * Light cleanup of on-device OCR noise before parsePurchasePaste.
 * Never invents prices, quantities, or nutrition.
 */

/** Collapse OCR garbage while preserving line structure for the paste parser. */
export function cleanOcrPurchaseText(raw: string): string {
  const normalized = raw
    .replace(/\u00a0/g, ' ')
    .replace(/[|¦]/g, ' ')
    .replace(/[•·∙]/g, ' ')
    .replace(/₽/g, ' ₽')
    .replace(/руб\.?/gi, ' ₽')
    .replace(/(\d)\s+[.,]\s+(\d)/g, '$1.$2')
    .replace(/[ \t]+/g, ' ');

  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  // Drop ultra-short OCR noise (single glyphs) unless digit (qty/price fragment).
  const kept = lines.filter((line) => line.length >= 2 || /^\d/.test(line));

  return kept.join('\n').trim();
}

/** Join OCR line detections (reading order) into paste-ready text. */
export function joinOcrDetections(detections: Array<{ text: string }>): string {
  return cleanOcrPurchaseText(detections.map((d) => d.text.trim()).filter(Boolean).join('\n'));
}
