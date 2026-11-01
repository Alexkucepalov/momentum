export type GarminChartSeriesKey = 'heartRate' | 'speed' | 'power' | 'cadence' | 'altitude';

export type MappedGarminChartSeries = {
  key: GarminChartSeriesKey;
  labelRu: string;
  unit: string;
  /** Downsampled samples; x is relative seconds from start when available, else index. */
  samples: Array<{ t: number; v: number }>;
};

export type MappedGarminCharts = {
  series: MappedGarminChartSeries[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function finiteNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

const KEY_MAP: Array<{ match: RegExp; key: GarminChartSeriesKey; labelRu: string; unit: string }> = [
  { match: /heartrate|heart_rate|directheartrate/i, key: 'heartRate', labelRu: 'Пульс', unit: 'уд/м' },
  { match: /directspeed|speed(?!.*air)/i, key: 'speed', labelRu: 'Скорость', unit: 'м/с' },
  { match: /directpower|power(?!.*curve)/i, key: 'power', labelRu: 'Мощность', unit: 'Вт' },
  { match: /cadence|bikecadence|directbike/i, key: 'cadence', labelRu: 'Каденс', unit: 'rpm' },
  { match: /altitude|elevation|directelevation/i, key: 'altitude', labelRu: 'Высота', unit: 'м' },
];

function classifyMetric(keyRaw: string): (typeof KEY_MAP)[number] | null {
  const k = keyRaw.replace(/^direct/i, 'direct');
  for (const row of KEY_MAP) {
    if (row.match.test(k)) return row;
  }
  return null;
}

function downsampleSamples(
  samples: Array<{ t: number; v: number }>,
  maxPoints = 300,
): Array<{ t: number; v: number }> {
  if (samples.length <= maxPoints) return samples;
  const out: Array<{ t: number; v: number }> = [];
  const last = samples.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * last) / (maxPoints - 1));
    out.push(samples[idx]!);
  }
  return out;
}

/**
 * Map Garmin activity details chart metrics (metricDescriptors + activityDetailMetrics).
 */
export function mapGarminChartSeries(payload: unknown, maxPoints = 300): MappedGarminCharts | null {
  const root = asRecord(payload);
  if (!root) return null;

  const descriptors = Array.isArray(root.metricDescriptors) ? root.metricDescriptors : [];
  const rows = Array.isArray(root.activityDetailMetrics) ? root.activityDetailMetrics : [];
  if (descriptors.length === 0 || rows.length === 0) return null;

  let timeIndex: number | null = null;
  const wanted: Array<{
    index: number;
    key: GarminChartSeriesKey;
    labelRu: string;
    unit: string;
  }> = [];

  for (const d of descriptors) {
    const rec = asRecord(d);
    if (!rec) continue;
    const idx = finiteNumber(rec.metricsIndex);
    const key = typeof rec.key === 'string' ? rec.key : '';
    if (idx == null || !key) continue;
    if (/timestamp|time/i.test(key) && !/timer/i.test(key)) {
      timeIndex = idx;
      continue;
    }
    const cls = classifyMetric(key);
    if (!cls) continue;
    if (wanted.some((w) => w.key === cls.key)) continue;
    wanted.push({ index: idx, key: cls.key, labelRu: cls.labelRu, unit: cls.unit });
  }

  if (wanted.length === 0) return null;

  const buckets: Record<string, Array<{ t: number; v: number }>> = {};
  for (const w of wanted) buckets[w.key] = [];

  let i = 0;
  for (const row of rows) {
    const rec = asRecord(row);
    const metrics = Array.isArray(rec?.metrics)
      ? (rec!.metrics as unknown[])
      : Array.isArray(row)
        ? (row as unknown[])
        : null;
    if (!metrics) continue;
    const tRaw = timeIndex != null ? finiteNumber(metrics[timeIndex]) : null;
    const t = tRaw != null ? tRaw : i;
    i += 1;
    for (const w of wanted) {
      const v = finiteNumber(metrics[w.index]);
      if (v == null) continue;
      buckets[w.key]!.push({ t, v });
    }
  }

  // Normalize time to seconds from first sample when timestamps look like epoch ms.
  for (const w of wanted) {
    const samples = buckets[w.key]!;
    if (samples.length === 0) continue;
    const first = samples[0]!.t;
    if (first > 1e12) {
      for (const s of samples) s.t = (s.t - first) / 1000;
    } else if (first > 1e9) {
      for (const s of samples) s.t = s.t - first;
    }
  }

  const series: MappedGarminChartSeries[] = [];
  for (const w of wanted) {
    const samples = downsampleSamples(buckets[w.key]!, maxPoints);
    if (samples.length < 2) continue;
    series.push({
      key: w.key,
      labelRu: w.labelRu,
      unit: w.unit,
      samples,
    });
  }

  return series.length > 0 ? { series } : null;
}

export function chartsToJson(charts: MappedGarminCharts | null): string | null {
  if (!charts || charts.series.length === 0) return null;
  try {
    return JSON.stringify(charts);
  } catch {
    return null;
  }
}

export function parseChartJson(raw: string | null | undefined): MappedGarminCharts | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as MappedGarminCharts;
    if (!obj || !Array.isArray(obj.series) || obj.series.length === 0) return null;
    return obj;
  } catch {
    return null;
  }
}
