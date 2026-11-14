/**
 * Parse weight/reps field from the set log UI.
 * Empty → null (unknown). Rejects negative / non-finite. Never invents 0 from blank.
 */
export function parseOptionalNonNegativeNumber(raw: string):
  | { ok: true; value: number | null }
  | { ok: false; error: string } {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false, error: 'Нужно число' };
  if (n < 0) return { ok: false, error: 'Не может быть меньше 0' };
  return { ok: true, value: n };
}

export function parseOptionalRepetitions(raw: string): ReturnType<typeof parseOptionalNonNegativeNumber> {
  const result = parseOptionalNonNegativeNumber(raw);
  if (result.ok && result.value != null && !Number.isInteger(result.value)) {
    return { ok: false, error: 'Повторения — целое число' };
  }
  return result;
}
