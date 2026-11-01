/**
 * Parse Zepp Life / Mi Fit BODY_*.csv export rows.
 * Columns (typical): time,weight,height,bmi,fatRate,bodyWaterRate,boneMass,metabolism,muscleRate,visceralFat
 * Unknown / missing weight → skip (never invent).
 */

export type MappedZeppWeight = {
  kg: number;
  weighedAt: string;
  externalId: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function toIsoWeighedAt(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  // e.g. 2026-01-01 06:09:29+0000 or 2026-01-01T06:09:29Z
  const normalized = t.includes('T')
    ? t
    : t.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

/**
 * Parse full CSV text (with or without header). Returns deduped by externalId (timestamp).
 */
export function parseZeppBodyCsv(csvText: string): MappedZeppWeight[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  let start = 0;
  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  let timeIdx = 0;
  let weightIdx = 1;
  if (header.includes('time') || header.includes('weight')) {
    timeIdx = Math.max(0, header.indexOf('time'));
    weightIdx = header.indexOf('weight');
    if (weightIdx < 0) weightIdx = 1;
    start = 1;
  }

  const out: MappedZeppWeight[] = [];
  const seen = new Set<string>();
  for (let i = start; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const timeRaw = cols[timeIdx] ?? '';
    const weightRaw = cols[weightIdx] ?? '';
    const weighedAt = toIsoWeighedAt(timeRaw);
    const kg = Number(String(weightRaw).replace(',', '.'));
    if (!weighedAt || !Number.isFinite(kg) || kg < 20 || kg > 400) continue;
    const externalId = `zepp-weight:${weighedAt}`;
    if (seen.has(externalId)) continue;
    seen.add(externalId);
    out.push({ kg: Math.round(kg * 100) / 100, weighedAt, externalId });
  }
  return out;
}
