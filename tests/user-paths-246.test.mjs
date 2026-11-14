import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mods = loadSrcModules();
const { remainingField } = mods['domain/remainingMacros'];

describe('user paths #246', () => {
  it('KcalRing prefers remaining when target known', () => {
    const src = readFileSync(
      join(root, 'apps/mobile/src/components/KcalRing.tsx'),
      'utf8',
    );
    assert.ok(src.includes('remainingField'));
    assert.ok(src.includes('Осталось'));
    assert.ok(src.includes('Перебор'));
    assert.ok(src.includes('съедено'));
    assert.equal(remainingField(2000, 1520), 480);
    assert.equal(remainingField(2000, 0), 2000);
  });

  it('catalog filter load/save is wired on Food tab', () => {
    const food = readFileSync(join(root, 'apps/mobile/app/(tabs)/food.tsx'), 'utf8');
    assert.ok(food.includes('loadCatalogFilter'));
    assert.ok(food.includes('saveCatalogFilter'));
    assert.ok(food.includes('onCatalogFilterChange'));
    const prefs = readFileSync(
      join(root, 'apps/mobile/src/storage/uiPrefs.ts'),
      'utf8',
    );
    assert.ok(prefs.includes('nf-fit-ui-prefs.json'));
    assert.ok(prefs.includes('clearUiPrefs'));
  });

  it('Profile day-report duplicates Progress; deep-links to reports', () => {
    const profile = readFileSync(
      join(root, 'apps/mobile/app/(tabs)/profile.tsx'),
      'utf8',
    );
    assert.ok(!profile.includes('collectDayReportText'));
    assert.ok(profile.includes("segment=reports"));
    assert.ok(profile.includes('clearUiPrefs'));
    const progress = readFileSync(
      join(root, 'apps/mobile/app/(tabs)/progress.tsx'),
      'utf8',
    );
    assert.ok(progress.includes('collectDayReportText'));
    assert.ok(progress.includes('progress-copy-day-chatgpt'));
  });

  it('manual Сила opens strength hub instead of vague workout note', () => {
    const form = readFileSync(
      join(root, 'apps/mobile/src/features/activity/WorkoutFormSheet.tsx'),
      'utf8',
    );
    assert.ok(form.includes('onOpenStrengthHub'));
    assert.ok(form.includes("t.type === 'strength'"));
    const activity = readFileSync(
      join(root, 'apps/mobile/app/(tabs)/activity.tsx'),
      'utf8',
    );
    assert.ok(activity.includes('onOpenStrengthHub'));
    assert.ok(activity.includes('strengthHubHref'));
  });
});
