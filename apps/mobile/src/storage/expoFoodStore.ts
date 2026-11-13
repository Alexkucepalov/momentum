import {
  asPersistable,
  createMemoryFoodRepository,
  type FoodRepository,
} from '../../../../src/storage/foodRepository';
import type { StoreSnapshot, StoreSnapshotAny } from '../../../../src/storage/types';
import { parseExportJson } from '../../../../src/domain/importExport';

const WEB_SNAPSHOT_KEY = 'momentum.web.store_snapshot.v1';

function readWebSnapshot(): StoreSnapshotAny | undefined {
  if (typeof globalThis.localStorage === 'undefined') return undefined;
  const raw = globalThis.localStorage.getItem(WEB_SNAPSHOT_KEY);
  if (!raw) return undefined;
  const parsed = parseExportJson(raw);
  if (!parsed.ok) throw new Error('Локальный снимок данных не удалось прочитать');
  return parsed.snapshot;
}

function writeWebSnapshot(snap: StoreSnapshot): void {
  if (typeof globalThis.localStorage === 'undefined') throw new Error('Хранилище недоступно');
  globalThis.localStorage.setItem(WEB_SNAPSHOT_KEY, JSON.stringify(snap));
}

/**
 * Web entry: memory repo + localStorage so demo import survives refresh.
 * Native builds use `expoFoodStore.native.ts` (SQLite).
 */
export function openPersistentFoodRepository(): FoodRepository {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const snapshot = readWebSnapshot();
  const repo = createMemoryFoodRepository({ timezone, snapshot });
  asPersistable(repo).setPersistHook((snap) => writeWebSnapshot(snap));
  return repo;
}

/** Clear web persistence (tests / debugging). */
export function clearWebFoodStorePersistence(): void {
  try {
    globalThis.localStorage?.removeItem(WEB_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}
