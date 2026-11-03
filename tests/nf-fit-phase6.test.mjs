import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();

test('Phase 6 schema: SCHEMA_VERSION 8 quality/beta meta + widgets flag', () => {
  const {
    SCHEMA_VERSION,
    migrateExpoDb,
    getAppliedSchemaVersion,
    PHASE6_META,
  } = mods['storage/migrations'];

  assert.equal(SCHEMA_VERSION, 8);
  assert.equal(PHASE6_META.phase, '6-quality-beta');
  assert.equal(PHASE6_META.widgetsScaffold, true);

  const migrations = new Map();
  const meta = new Map();

  const db = {
    execSync() {},
    getFirstSync(sql) {
      if (String(sql).includes('MAX(version)')) {
        const versions = [...migrations.keys()];
        return { version: versions.length ? Math.max(...versions) : null };
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
      }
    },
  };

  migrateExpoDb(db);
  assert.equal(getAppliedSchemaVersion(db), 8);
  assert.equal(meta.get('product'), 'nf-fit');
  assert.equal(meta.get('phase'), '6-quality-beta');
  assert.equal(meta.get('widgets_scaffold'), '1');
});

test('Phase 6 widget contract: unknown energy never displays as 0', () => {
  const {
    formatTodayWidgetDisplay,
    widgetEnergyFromTotals,
    WIDGET_SCAFFOLD,
  } = mods['widgets/todayWidgetContract'];

  assert.equal(WIDGET_SCAFFOLD.binaryShipped, false);
  assert.equal(WIDGET_SCAFFOLD.product, 'nf-fit');

  assert.equal(
    widgetEnergyFromTotals({ entryCount: 0, energyKcal: 0, hasUnknownFields: false }),
    null,
  );
  assert.equal(
    widgetEnergyFromTotals({ entryCount: 2, energyKcal: null, hasUnknownFields: true }),
    null,
  );
  assert.equal(
    widgetEnergyFromTotals({ entryCount: 1, energyKcal: 500, hasUnknownFields: false }),
    500,
  );

  const display = formatTodayWidgetDisplay({
    dateLocal: '2026-10-31',
    energyKcal: null,
    waterMl: null,
    streakDays: null,
    nextMealHint: null,
  });
  assert.equal(display.energyLabel, '— ккал');
  assert.equal(display.waterLabel, '— мл');
  assert.equal(display.stepsLabel, '— шаг');
  assert.equal(display.sleepLabel, '— ч');
  assert.equal(display.streakLabel, '— дн.');
  assert.equal(display.energyValue, '—');
  assert.equal(display.stepsValue, '—');
  assert.ok(!display.energyLabel.includes('0 ккал'));

  const known = formatTodayWidgetDisplay({
    dateLocal: '2026-10-31',
    energyKcal: 500,
    waterMl: 250,
    steps: 8123,
    sleepSec: 7.5 * 3600,
    streakDays: 3,
    nextMealHint: 'Обед',
    energyTargetKcal: 2000,
    waterTargetMl: 2000,
  });
  assert.equal(known.energyLabel, '500 ккал');
  assert.equal(known.waterLabel, '250 мл');
  assert.match(known.stepsLabel, /8.?123/);
  assert.equal(known.sleepLabel, '7.5 ч');
  assert.equal(known.streakLabel, '3 дн.');
  assert.equal(known.nextMealHint, 'Обед');
  assert.equal(known.energyValue, '500');
  assert.equal(known.stepsValue, '8123');
  assert.equal(known.sleepValue, '7.5');
  assert.equal(known.dayLabel, '31.10');
  assert.match(known.energyDots, /●/);
});

test('Phase 6 quality docs and widget plugin scaffold exist', () => {
  const required = [
    'docs/PHASE6-QUALITY-BETA.md',
    'docs/13-WIDGETS-SCAFFOLD.md',
    'src/widgets/todayWidgetContract.ts',
    'apps/mobile/plugins/withNfFitWidgets.js',
    'apps/mobile/app.json',
  ];
  for (const rel of required) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
  }
  const appJson = JSON.parse(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8'));
  assert.ok(
    appJson.expo.plugins.some(
      (p) => p === './plugins/withNfFitWidgets.js' || (Array.isArray(p) && p[0].includes('withNfFit')),
    ),
    'widget plugin not wired in app.json',
  );
  const plugin = readFileSync(join(root, 'apps/mobile/plugins/withNfFitWidgets.js'), 'utf8');
  assert.ok(plugin.includes('nfFitWidgets'));
  assert.ok(plugin.includes('scaffold') || plugin.includes('variants'));
  assert.ok(plugin.includes('CompactKcalWidgetProvider'));
  assert.ok(plugin.includes('StepsWidgetProvider'));
  assert.ok(plugin.includes('WaterWidgetProvider'));
  assert.ok(plugin.includes('SleepWidgetProvider'));
  assert.ok(plugin.includes('nothing-light-pixel') || plugin.includes('Press Start'));

  const checklist = readFileSync(join(root, 'docs/PHASE6-QUALITY-BETA.md'), 'utf8');
  assert.ok(checklist.includes('human-gated') || checklist.includes('human'));
  assert.ok(checklist.includes('Play'));
  assert.ok(!/publish to production|автопублик/i.test(checklist));
});
