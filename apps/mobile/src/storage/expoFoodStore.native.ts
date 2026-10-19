import * as SQLite from 'expo-sqlite';

import {
  asPersistable,
  createMemoryFoodRepository,
  type FoodRepository,
} from '../../../../src/storage/foodRepository';
import { migrateExpoDb } from '../../../../src/storage/migrations';
import type { StoreSnapshot, StoreSnapshotAny } from '../../../../src/storage/types';

const DB_NAME = 'momentum.db';

function readSnapshot(db: SQLite.SQLiteDatabase): StoreSnapshotAny | undefined {
  const row = db.getFirstSync<{ payload: string }>('SELECT payload FROM store_snapshot WHERE id = 1');
  if (!row?.payload) return undefined;
  return JSON.parse(row.payload) as StoreSnapshotAny;
}

function writeSnapshot(db: SQLite.SQLiteDatabase, snap: StoreSnapshot): void {
  const payload = JSON.stringify(snap);
  const updatedAt = new Date().toISOString();
  db.runSync(
    `INSERT INTO store_snapshot (id, payload, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    [payload, updatedAt],
  );
}

/** Native (Android/iOS): durable SQLite-backed store. */
export function openPersistentFoodRepository(): FoodRepository {
  const db = SQLite.openDatabaseSync(DB_NAME);
  migrateExpoDb(db as Parameters<typeof migrateExpoDb>[0]);
  const snapshot = readSnapshot(db);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const repo = createMemoryFoodRepository({ timezone, snapshot });
  asPersistable(repo).setPersistHook((snap) => writeSnapshot(db, snap));
  return repo;
}
