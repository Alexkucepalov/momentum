import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('nf-fit tokens: Fresh Utility contract', () => {
  const { colors, radius, type, TAB_SHELL, touchMin } = loadSrcModules()['design-system/tokens'];
  assert.equal(colors.canvas, '#F2F3F5');
  assert.equal(colors.surface, '#FFFFFF');
  assert.equal(colors.ink, '#0A0A0A');
  assert.equal(colors.primary, '#0A0A0A');
  assert.equal(colors.primaryButton, '#0A0A0A');
  assert.equal(colors.surfaceMuted, '#EBEDF0');
  assert.equal(colors.trainingStrength, '#EBEDF0');
  assert.equal(colors.sageInk, colors.ink);
  assert.ok(radius.card >= 12 && radius.card <= 24);
  assert.equal(radius.pill, 999);
  assert.equal(type.metric, 46);
  assert.equal(touchMin, 48);
  // Target shell after Stage 3 (Movement). Temporary 6th Sleep tab may still exist in UI.
  assert.deepEqual([...TAB_SHELL], ['today', 'food', 'movement', 'progress', 'profile']);
});

test('formatMetricValue: unknown ≠ 0', () => {
  const { formatMetricValue } = loadSrcModules()['design-system/metricFormat'];
  assert.equal(formatMetricValue(null), '—');
  assert.equal(formatMetricValue(undefined), '—');
  assert.equal(formatMetricValue(Number.NaN), '—');
  assert.equal(formatMetricValue(0), '0');
  assert.equal(formatMetricValue(120), '120');
});

test('SQLite migrations: versioned scaffold reaches SCHEMA_VERSION', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    SCHEMA_ENTITY_STUBS,
  } = loadSrcModules()['storage/migrations'];

  assert.ok(SCHEMA_VERSION >= 2);
  assert.ok(SCHEMA_ENTITY_STUBS.length >= 4);

  const statements = [];
  const migrations = new Map();
  const meta = new Map();
  const stubs = new Map();

  const db = {
    execSync(sql) {
      statements.push(sql);
    },
    getFirstSync(sql) {
      if (String(sql).includes('MAX(version)')) {
        const versions = [...migrations.keys()];
        const version = versions.length ? Math.max(...versions) : null;
        return { version };
      }
      return null;
    },
    runSync(sql, params = []) {
      const s = String(sql);
      if (s.includes('schema_migrations')) {
        migrations.set(params[0], params[1]);
        return;
      }
      if (s.includes('app_meta')) {
        meta.set(params[0], params[1]);
        return;
      }
      if (s.includes('schema_entity_stub')) {
        // V2 INSERT OR IGNORE / V3 INSERT…ON CONFLICT — params[0]=name, [1]=status|notes
        const name = params[0];
        if (s.includes('ON CONFLICT') || s.includes('INSERT OR REPLACE') || s.includes('DO UPDATE')) {
          stubs.set(name, { status: 'active', notes: params[1] });
        } else if (!stubs.has(name)) {
          stubs.set(name, { status: params[1], notes: params[2] });
        }
      }
    },
  };

  migrateExpoDb(db);
  assert.equal(getAppliedSchemaVersion(db), SCHEMA_VERSION);
  assert.equal(meta.get('product'), 'nf-fit');
  assert.ok(stubs.has('FoodEntry'));
  // Idempotent second pass
  const before = migrations.size;
  migrateExpoDb(db);
  assert.equal(migrations.size, before);
  assert.ok(statements.some((s) => String(s).includes('store_snapshot')));
  assert.ok(statements.some((s) => String(s).includes('app_meta')));
});

test('Phase 0 docs and design references exist', () => {
  const required = [
    'docs/00-PROJECT-BLUEPRINT.md',
    'docs/04-DESIGN-SYSTEM.md',
    'docs/05-DESIGN-REFERENCES.md',
    'docs/13-WIDGETS-SCAFFOLD.md',
    'docs/visual-direction.md',
    'design/references/NOTES.md',
    'design/references/e3d68fc3-ee94-433c-bdf1-ceb4d7b2c1b2.png',
    'apps/mobile/src/design-system/index.ts',
    'apps/mobile/app/(tabs)/_layout.tsx',
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }
  const appJson = JSON.parse(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8'));
  assert.equal(appJson.expo.name, 'nf-fit');
  assert.equal(appJson.expo.slug, 'nf-fit');
  const layout = readFileSync(join(root, 'apps/mobile/app/(tabs)/_layout.tsx'), 'utf8');
  for (const label of ['Today tab', 'Food tab', 'Movement tab', 'Progress tab', 'Profile tab']) {
    assert.ok(layout.includes(label), `tab shell missing a11y ${label}`);
  }
  assert.ok(layout.includes('href: null'), 'sleep tab should be hidden from tab bar');
});
