/**
 * Neutral weight trend helpers — display only, no goals or judgment copy.
 */

export type WeightSparkPoint = {
  kg: number;
  /** 0..1 bar height relative to min/max in the series. */
  height: number;
};

export type WeightLinePoint = {
  kg: number;
  /** 0..1 left → right (oldest → newest). */
  x: number;
  /** 0..1 bottom → top relative to min/max (SVG y is inverted by the view). */
  y: number;
};

function finitePositiveKg(kgs: number[]): number[] {
  return kgs.filter((k) => Number.isFinite(k) && k > 0);
}

function minMax(finite: number[]): { min: number; max: number } {
  let min = finite[0]!;
  let max = finite[0]!;
  for (const k of finite) {
    if (k < min) min = k;
    if (k > max) max = k;
  }
  return { min, max };
}

/**
 * Build sparkline heights from newest-first or oldest-first kg list.
 * Single point → height 0.5. Empty → []. Never invents kg values.
 */
export function weightSparkline(kgs: number[]): WeightSparkPoint[] {
  const finite = finitePositiveKg(kgs);
  if (finite.length === 0) return [];
  if (finite.length === 1) return [{ kg: finite[0]!, height: 0.5 }];

  const { min, max } = minMax(finite);
  const span = max - min;
  if (span === 0) {
    return finite.map((kg) => ({ kg, height: 0.5 }));
  }
  return finite.map((kg) => ({
    kg,
    height: 0.2 + ((kg - min) / span) * 0.8,
  }));
}

/** Floor for vertical scale so ±0.1 kg noise does not fill the whole chart. */
export const WEIGHT_CHART_MIN_SPAN_KG = 2;

/**
 * Line-chart points in unit square. Expect chronological (oldest → newest) input.
 * Single point → center. Empty → []. Never invents kg values.
 * Tiny ranges are padded to WEIGHT_CHART_MIN_SPAN_KG around the series mid.
 */
export function weightLinePoints(kgs: number[]): WeightLinePoint[] {
  const finite = finitePositiveKg(kgs);
  if (finite.length === 0) return [];
  if (finite.length === 1) return [{ kg: finite[0]!, x: 0.5, y: 0.5 }];

  const { min, max } = minMax(finite);
  const span = max - min;
  const mid = (min + max) / 2;
  const scaleSpan = Math.max(span, WEIGHT_CHART_MIN_SPAN_KG);
  const yMin = mid - scaleSpan / 2;
  const last = finite.length - 1;

  return finite.map((kg, i) => {
    const x = i / last;
    const yNorm = (kg - yMin) / scaleSpan;
    // Keep a quiet vertical margin inside the plot.
    const y = 0.12 + yNorm * 0.76;
    return { kg, x, y };
  });
}

/** Oldest → newest for left-to-right chart. Input may be newest-first. */
export function chronologicalKg(newestFirst: number[]): number[] {
  return [...newestFirst].reverse();
}
