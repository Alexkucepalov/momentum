const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const RU_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** Format YYYY-MM-DD → ДД.ММ.ГГГГ (e.g. 10.11.2026). */
export function formatDateRu(iso: string): string {
  if (!ISO_RE.test(iso)) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Parse ДД.ММ.ГГГГ or YYYY-MM-DD → YYYY-MM-DD.
 * Throws on invalid calendar date.
 */
export function parseDateRu(raw: string): string {
  const t = raw.trim();
  if (ISO_RE.test(t)) {
    assertValidIso(t);
    return t;
  }
  const m = RU_RE.exec(t);
  if (!m) throw new Error('Дата: ДД.ММ.ГГГГ');
  const dd = m[1]!.padStart(2, '0');
  const mm = m[2]!.padStart(2, '0');
  const yyyy = m[3]!;
  const iso = `${yyyy}-${mm}-${dd}`;
  assertValidIso(iso);
  return iso;
}

function assertValidIso(iso: string): void {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new Error('Некорректная дата');
  }
}
