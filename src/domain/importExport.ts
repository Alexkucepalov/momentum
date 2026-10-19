import type { StoreSnapshot, StoreSnapshotAny } from '../storage/types';

export type ParseExportResult =
  | { ok: true; snapshot: StoreSnapshotAny; exportedAt: string | null }
  | { ok: false; error: string };

/**
 * Validate clipboard / file JSON from exportAll().
 * Does not invent data — rejects malformed payloads early.
 */
export function parseExportJson(raw: string): ParseExportResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Пустой текст — вставь JSON экспорта' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'Неверный JSON' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Ожидался объект экспорта' };
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.version !== 'number') {
    return { ok: false, error: 'Нет поля version — это не экспорт Momentum' };
  }
  if (obj.version < 1 || obj.version > 9) {
    return { ok: false, error: `Неподдерживаемая версия снимка: ${obj.version}` };
  }
  if (!obj.profile || typeof obj.profile !== 'object') {
    return { ok: false, error: 'В экспорте нет профиля' };
  }
  if (!Array.isArray(obj.products) || !Array.isArray(obj.entries) || !Array.isArray(obj.recipes)) {
    return { ok: false, error: 'В экспорте нет списков products / recipes / entries' };
  }
  const exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : null;
  return {
    ok: true,
    exportedAt,
    snapshot: obj as unknown as StoreSnapshotAny,
  };
}

export type ImportSummary = {
  products: number;
  recipes: number;
  entries: number;
  workouts: number;
  version: number;
};

export function summarizeSnapshot(snap: StoreSnapshot | StoreSnapshotAny): ImportSummary {
  return {
    products: (snap.products ?? []).filter((p) => !p.deletedAt).length,
    recipes: (snap.recipes ?? []).filter((r) => !r.deletedAt).length,
    entries: (snap.entries ?? []).filter((e) => !e.deletedAt).length,
    workouts: (snap.workouts ?? []).filter((w) => !w.deletedAt).length,
    version: snap.version,
  };
}
