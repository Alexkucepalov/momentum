import type { MappedGarminChartSeries } from './mapChart';

export type ProjectedChart = {
  pointsAttr: string;
  minV: number;
  maxV: number;
};

export function projectChartSeries(
  series: MappedGarminChartSeries,
  width: number,
  height: number,
  padding = 8,
): ProjectedChart | null {
  const samples = series.samples;
  if (samples.length < 2 || width <= 0 || height <= 0) return null;
  let minV = samples[0]!.v;
  let maxV = samples[0]!.v;
  let minT = samples[0]!.t;
  let maxT = samples[0]!.t;
  for (const s of samples) {
    if (s.v < minV) minV = s.v;
    if (s.v > maxV) maxV = s.v;
    if (s.t < minT) minT = s.t;
    if (s.t > maxT) maxT = s.t;
  }
  let vSpan = maxV - minV;
  let tSpan = maxT - minT;
  if (vSpan < 1e-6) vSpan = 1;
  if (tSpan < 1e-6) tSpan = 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const pts = samples.map((s) => {
    const x = padding + ((s.t - minT) / tSpan) * innerW;
    const y = padding + (1 - (s.v - minV) / vSpan) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return { pointsAttr: pts.join(' '), minV, maxV };
}
