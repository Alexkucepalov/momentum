/**
 * Produce barcode variants for catalog lookup (UPC-A ↔ EAN-13, digits only).
 * Does not invent products — only alternate encodings of the same scan.
 */
export function cleanBarcodeDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isPlausibleBarcode(digits: string): boolean {
  return /^\d{8,14}$/.test(digits);
}

/** Ordered unique candidates to try against local cache / Open Food Facts. */
export function barcodeLookupCandidates(raw: string): string[] {
  const cleaned = cleanBarcodeDigits(raw);
  const out: string[] = [];
  const push = (c: string) => {
    if (isPlausibleBarcode(c) && !out.includes(c)) out.push(c);
  };

  push(cleaned);

  // UPC-A (12) ↔ EAN-13 (leading 0)
  if (cleaned.length === 12) push(`0${cleaned}`);
  if (cleaned.length === 13 && cleaned.startsWith('0')) push(cleaned.slice(1));

  // Some scanners drop a leading zero on EAN-13 for RU (460…)
  if (cleaned.length === 12 && cleaned.startsWith('46')) push(`0${cleaned}`);

  // GTIN-14 / ITF-14 → EAN-13 (strip packaging indicator / leading zeros)
  if (cleaned.length === 14) {
    push(cleaned.slice(1));
    if (cleaned.startsWith('0')) push(cleaned.replace(/^0+/, '').padStart(13, '0'));
    const stripped = cleaned.replace(/^0+/, '');
    if (stripped.length >= 8 && stripped.length <= 13) push(stripped);
    if (stripped.length === 12) push(`0${stripped}`);
  }

  // EAN-8 left-pad to 13 (rare, but cheap to try)
  if (cleaned.length === 8) push(cleaned.padStart(13, '0'));

  // Extra leading zeros from some Android scanners (15+ clipped by plausibility)
  if (cleaned.length === 13 && cleaned.startsWith('00')) {
    push(cleaned.slice(1));
  }

  return out;
}
