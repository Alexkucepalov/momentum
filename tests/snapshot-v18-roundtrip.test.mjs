import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const { parseExportJson } = mods['domain/importExport'];

/**
 * A10: export → wipe → import must restore sleep + garmin bookkeeping fields (snapshot v18).
 * Synthetic fixtures only — no real health records.
 */
describe('snapshot v18 export → delete → import', () => {
  it('restores sleepNights and rejects invented zero sleep', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    repo.upsertSleepNight({
      dateLocal: '2026-11-01',
      sleepSec: 25200,
      deepSec: null,
      lightSec: 14400,
      remSec: null,
      awakeSec: null,
      sleepScore: 80,
      source: 'garmin',
      externalId: 'garmin-sleep:2026-11-01',
    });
    repo.upsertDailyActivityStats({
      dateLocal: '2026-11-01',
      steps: 5000,
      distanceM: null,
      activeKcal: null,
      source: 'garmin',
      externalId: 'garmin-steps:2026-11-01',
    });

    const json = repo.exportAll();
    const parsed = parseExportJson(json);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.snapshot.version, 19);
    assert.ok(Array.isArray(parsed.snapshot.sleepNights));
    assert.equal(parsed.snapshot.sleepNights.length, 1);
    assert.equal(parsed.snapshot.sleepNights[0].deepSec, null);

    repo.deleteAllUserData();
    assert.equal(repo.getSleepForDate('2026-11-01'), null);
    assert.equal(repo.getDailyActivityStats('2026-11-01'), null);

    const result = repo.importAll(json);
    assert.equal(result.version, 19);
    const night = repo.getSleepForDate('2026-11-01');
    assert.ok(night);
    assert.equal(night.sleepSec, 25200);
    assert.equal(night.deepSec, null);
    assert.equal(night.lightSec, 14400);
    assert.equal(repo.getDailyActivityStats('2026-11-01')?.steps, 5000);
  });

  it('parseExportJson accepts v18/v19 and rejects v20', () => {
    const base = {
      version: 18,
      profile: { id: 'x', timezone: 'UTC', locale: 'ru', units: 'metric' },
      products: [],
      recipes: [],
      entries: [],
      ingredients: [],
      sleepNights: [],
    };
    assert.equal(parseExportJson(JSON.stringify(base)).ok, true);
    assert.equal(parseExportJson(JSON.stringify({ ...base, version: 19 })).ok, true);
    assert.equal(parseExportJson(JSON.stringify({ ...base, version: 20 })).ok, false);
  });
});
