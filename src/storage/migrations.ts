/** SQL schema for Expo SQLite persistence of StoreSnapshot (+ future relational use). */
export const SCHEMA_VERSION = 1;

export const MIGRATION_V1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS store_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export type MigrateDb = {
  execSync(sql: string): void;
  getFirstSync: <T>(sql: string, params?: SQLiteBindLike) => T | null;
  runSync(sql: string, params?: SQLiteBindLike): void;
};

type SQLiteBindLike = Array<string | number | null | boolean>;

export function migrateExpoDb(db: MigrateDb): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const row = db.getFirstSync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations',
  );
  const current = row?.version ?? 0;
  if (current < 1) {
    db.execSync(MIGRATION_V1);
    db.runSync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      1,
      new Date().toISOString(),
    ]);
  }
}
