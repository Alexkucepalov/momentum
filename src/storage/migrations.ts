/**
 * Versioned SQLite migrations for Expo persistence.
 * V1: store_snapshot blob (existing dogfood).
 * V2: nf-fit foundation meta stub — no seed food / invented nutrients.
 * V3: activate Phase 1 nutrition entities (catalog + diary); still no invented rows.
 * V4: activate Phase 2 recipe entities (CRUD + cooked yield); still no invented nutrients.
 * V5: activate Phase 3 Today+Profile entities (UserProfile, WaterEntry).
 */

export const SCHEMA_VERSION = 5;

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

/** Domain entity registry — Phase 1–3 marked active; never seed fake nutrients. */
export const SCHEMA_ENTITY_STUBS: ReadonlyArray<{
  entity_name: string;
  status: 'planned' | 'active';
  notes: string;
}> = [
  { entity_name: 'UserProfile', status: 'active', notes: 'Phase 3 Profile goals/privacy' },
  { entity_name: 'NutritionTarget', status: 'active', notes: 'Phase 1; unknown ≠ 0' },
  { entity_name: 'FoodProduct', status: 'active', notes: 'Phase 1 catalog' },
  { entity_name: 'FoodEntry', status: 'active', notes: 'Phase 1 diary + nutrient snapshot' },
  { entity_name: 'MealTemplate', status: 'active', notes: 'Phase 1 saved meals / favorites repeat' },
  { entity_name: 'Recipe', status: 'active', notes: 'Phase 2; cooked yield required' },
  { entity_name: 'RecipeIngredient', status: 'active', notes: 'Phase 2; null macros stay null' },
  { entity_name: 'RecipeSnapshot', status: 'active', notes: 'Phase 2 diary portion snapshots' },
  { entity_name: 'WaterEntry', status: 'active', notes: 'Phase 3 Today water log' },
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

/** Entities activated in migration V4 (Phase 2 Recipes). */
export const PHASE2_ACTIVE_ENTITIES = [
  'Recipe',
  'RecipeIngredient',
  'RecipeSnapshot',
] as const;

/** Entities activated in migration V5 (Phase 3 Today + Profile). */
export const PHASE3_ACTIVE_ENTITIES = ['UserProfile', 'WaterEntry'] as const;

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

function activateEntities(
  db: MigrateDb,
  names: readonly string[],
  notes: string,
  phaseLabel: string,
): void {
  const now = new Date().toISOString();
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)', [
    'schema_target',
    String(SCHEMA_VERSION),
    now,
  ]);
  db.runSync('INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)', [
    'phase',
    phaseLabel,
    now,
  ]);
  for (const name of names) {
    db.runSync(
      `INSERT INTO schema_entity_stub (entity_name, status, notes) VALUES (?, 'active', ?)
       ON CONFLICT(entity_name) DO UPDATE SET status = 'active', notes = excluded.notes`,
      [name, notes],
    );
  }
}

function applyV3Phase1(db: MigrateDb): void {
  activateEntities(db, PHASE1_ACTIVE_ENTITIES, 'Phase 1 Nutrition Core', '1-nutrition');
}

function applyV4Phase2(db: MigrateDb): void {
  activateEntities(db, PHASE2_ACTIVE_ENTITIES, 'Phase 2 Recipes', '2-recipes');
}

function applyV5Phase3(db: MigrateDb): void {
  activateEntities(db, PHASE3_ACTIVE_ENTITIES, 'Phase 3 Today+Profile', '3-today-profile');
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
  if (current < 4) {
    applyV4Phase2(db);
    markApplied(db, 4);
  }
  if (current < 5) {
    applyV5Phase3(db);
    markApplied(db, 5);
  }
}
