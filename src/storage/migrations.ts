/**
 * Versioned SQLite migrations for Expo persistence.
 * V1: store_snapshot blob (existing dogfood).
 * V2: nf-fit foundation meta stub — no seed food / invented nutrients.
 * V3: activate Phase 1 nutrition entities (catalog + diary); still no invented rows.
 */

export const SCHEMA_VERSION = 3;

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

/** Foundation tables only — entity columns reserved; no production food rows. */
export const MIGRATION_V2 = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_entity_stub (
  entity_name TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'deprecated')),
  notes TEXT
);
`;

/** Domain entity registry — Phase 1 nutrition marked active; never seed fake nutrients. */
export const SCHEMA_ENTITY_STUBS: ReadonlyArray<{
  entity_name: string;
  status: 'planned' | 'active';
  notes: string;
}> = [
  { entity_name: 'UserProfile', status: 'planned', notes: 'Phase 3 Profile' },
  { entity_name: 'NutritionTarget', status: 'active', notes: 'Phase 1; unknown ≠ 0' },
  { entity_name: 'FoodProduct', status: 'active', notes: 'Phase 1 catalog' },
  { entity_name: 'FoodEntry', status: 'active', notes: 'Phase 1 diary + nutrient snapshot' },
  { entity_name: 'MealTemplate', status: 'active', notes: 'Phase 1 saved meals / favorites repeat' },
  { entity_name: 'WaterEntry', status: 'planned', notes: 'Phase 3' },
  { entity_name: 'WeightEntry', status: 'planned', notes: 'Phase 4' },
  { entity_name: 'Workout', status: 'planned', notes: 'Phase 4; no auto food kcal offset' },
  { entity_name: 'Habit', status: 'planned', notes: 'Phase 4' },
] as const;

/** Entities activated in migration V3 (Phase 1 Nutrition Core). */
export const PHASE1_ACTIVE_ENTITIES = [
  'NutritionTarget',
  'FoodProduct',
  'FoodEntry',
  'MealTemplate',
] as const;

export type MigrateDb = {
  execSync(sql: string): void;
  getFirstSync: <T>(sql: string, params?: SQLiteBindLike) => T | null;
  runSync(sql: string, params?: SQLiteBindLike): void;
};

type SQLiteBindLike = Array<string | number | null | boolean>;

export function getAppliedSchemaVersion(db: MigrateDb): number {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const row = db.getFirstSync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations',
  );
  return row?.version ?? 0;
}

function markApplied(db: MigrateDb, version: number): void {
  db.runSync('INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
    version,
    new Date().toISOString(),
  ]);
}

function applyV2Stubs(db: MigrateDb): void {
  const now = new Date().toISOString();
  db.runSync(
    'INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)',
    ['product', 'nf-fit', now],
  );
  db.runSync(
    'INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)',
    ['schema_target', String(SCHEMA_VERSION), now],
  );
  for (const stub of SCHEMA_ENTITY_STUBS) {
    db.runSync(
      'INSERT OR IGNORE INTO schema_entity_stub (entity_name, status, notes) VALUES (?, ?, ?)',
      [stub.entity_name, stub.status, stub.notes],
    );
  }
}

function applyV3Phase1(db: MigrateDb): void {
  const now = new Date().toISOString();
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)', [
    'schema_target',
    String(SCHEMA_VERSION),
    now,
  ]);
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)', [
    'phase',
    '1-nutrition',
    now,
  ]);
  for (const name of PHASE1_ACTIVE_ENTITIES) {
    db.runSync(
      `INSERT INTO schema_entity_stub (entity_name, status, notes) VALUES (?, 'active', ?)
       ON CONFLICT(entity_name) DO UPDATE SET status = 'active', notes = excluded.notes`,
      [name, 'Phase 1 Nutrition Core'],
    );
  }
}

export function migrateExpoDb(db: MigrateDb): void {
  const current = getAppliedSchemaVersion(db);
  if (current < 1) {
    db.execSync(MIGRATION_V1);
    markApplied(db, 1);
  }
  if (current < 2) {
    db.execSync(MIGRATION_V2);
    applyV2Stubs(db);
    markApplied(db, 2);
  }
  if (current < 3) {
    applyV3Phase1(db);
    markApplied(db, 3);
  }
}
