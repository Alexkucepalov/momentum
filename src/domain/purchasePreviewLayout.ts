/**
 * Purchase preview layout contract (Q-04).
 * Ensures card fields fit narrow Android viewports without horizontal page scroll.
 *
 * Formula: viewport − page padding×2 − card padding×2 − card border×2 ≥ min usable field width.
 */

export const PURCHASE_PREVIEW_VIEWPORTS_DP = [320, 360, 390] as const;

/** Typical FormScrollView / receipt `content` horizontal padding (`space.lg` ≈ 16). */
export const PREVIEW_PAGE_PADDING_DP = 16;

/** Card inner padding (`space.md` ≈ 12). */
export const PREVIEW_CARD_PADDING_DP = 12;

/** Card border each side. */
export const PREVIEW_CARD_BORDER_DP = 1;

/** Minimum usable width for a full-bleed text field inside the card. */
export const PREVIEW_MIN_FIELD_WIDTH_DP = 200;

export function purchasePreviewInnerFieldWidthDp(
  viewportWidthDp: number,
  pagePaddingDp = PREVIEW_PAGE_PADDING_DP,
  cardPaddingDp = PREVIEW_CARD_PADDING_DP,
  cardBorderDp = PREVIEW_CARD_BORDER_DP,
): number {
  if (!(viewportWidthDp > 0) || !Number.isFinite(viewportWidthDp)) {
    throw new Error('viewportWidthDp must be a positive finite number');
  }
  return (
    viewportWidthDp -
    pagePaddingDp * 2 -
    cardPaddingDp * 2 -
    cardBorderDp * 2
  );
}

export function purchasePreviewFitsViewport(
  viewportWidthDp: number,
  minFieldWidthDp = PREVIEW_MIN_FIELD_WIDTH_DP,
): boolean {
  return purchasePreviewInnerFieldWidthDp(viewportWidthDp) >= minFieldWidthDp;
}
