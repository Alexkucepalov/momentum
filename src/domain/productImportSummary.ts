/**
 * Post-import flash/summary for My products list paste.
 * Unknown macros stay unknown — we only count presence, never invent values.
 */

export type ProductImportMacroSource = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

export function productHasAnyKnownMacro(p: ProductImportMacroSource): boolean {
  return (
    p.energyKcal !== null ||
    p.proteinG !== null ||
    p.fatG !== null ||
    p.carbG !== null
  );
}

export type ProductImportCounts = {
  created: number;
  withMacros: number;
  needFill: number;
  skippedDuplicates: number;
};

/** RU one-liner for toast / banner. */
export function formatProductImportSummary(c: ProductImportCounts): string {
  const parts = [`Добавлено ${c.created}`];
  if (c.created > 0) {
    parts.push(`КБЖУ есть у ${c.withMacros}`);
    parts.push(`требуют уточнения ${c.needFill}`);
  }
  if (c.skippedDuplicates > 0) {
    parts.push(`дублей пропущено ${c.skippedDuplicates}`);
  }
  return parts.join(' · ');
}
