import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { buildDayReportText } = mods['domain/dayReport'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const {
  buildFlexibleReport,
  flexibleReportToPlainText,
} = mods['domain/flexibleReport'];

describe('day report for ChatGPT paste', () => {
  it('keeps unknown as dash and never invents kcal', () => {
    const text = buildDayReportText({
      dateLocal: '2026-11-01',
      generatedAtIso: '2026-11-01T12:00:00.000Z',
      nutrition: {
        entryCount: 1,
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbG: null,
        hasUnknownFields: true,
      },
      waterMl: 500,
      waterTargetMl: 2000,
      activityMinutes: 40,
      steps: null,
      workouts: [{ type: 'вело', durationMin: 40, calories: null, notes: 'станок' }],
      weightKg: 76.4,
      sleep: {
        sleepSec: 7 * 3600 + 12 * 60,
        deepSec: 3600,
        lightSec: 4 * 3600,
        remSec: 3600,
        awakeSec: 12 * 60,
        sleepScore: 82,
        avgSpo2: 96.5,
      },
      targets: {
        energyKcal: 2200,
        proteinG: 140,
        fatG: 70,
        carbG: 220,
      },
    });
    assert.match(text, /Отчёт nf-fit/);
    assert.match(text, /ккал —/);
    assert.match(text, /Шаги: —/);
    assert.match(text, /вело: 40 мин/);
    assert.match(text, /7 ч 12 мин/);
    assert.doesNotMatch(text, /стыдно|неудачник|провал/i);
  });

  it('repository sleep upsert + day report round-trip', () => {
    const repo = createMemoryFoodRepository({ timezone: 'Europe/Moscow' });
    repo.upsertSleepNight({
      dateLocal: '2026-11-01',
      sleepSec: 28800,
      deepSec: 7200,
      lightSec: 14400,
      remSec: 5400,
      awakeSec: 1800,
      sleepScore: 78,
      source: 'garmin',
      externalId: 'garmin-sleep:2026-11-01',
    });
    assert.equal(repo.toSnapshot().version, 19);
    const night = repo.getSleepForDate('2026-11-01');
    assert.ok(night);
    assert.equal(night.sleepSec, 28800);
    assert.equal(repo.getSleepForDate('2026-10-31'), null);
  });
});

describe('flexible report plain text', () => {
  it('exports markdown-ish text without inventing macros', () => {
    const report = buildFlexibleReport({
      periodStart: '2026-10-26',
      periodEnd: '2026-11-01',
      categories: ['nutrition', 'activity'],
      generatedAtIso: '2026-11-01T12:00:00.000Z',
      profile: {
        timezone: 'UTC',
        heightCm: null,
        waterTargetMl: null,
        dailyEnergyKcal: null,
        dailyProteinG: null,
        dailyFatG: null,
        dailyCarbG: null,
      },
      latestWeightKg: null,
      nutritionDays: [
        {
          dateLocal: '2026-11-01',
          entryCount: 1,
          energyKcal: null,
          proteinG: null,
          fatG: null,
          carbG: null,
          hasUnknownFields: true,
        },
      ],
      workouts: [],
      stepsDays: [],
      weights: [],
      habits: [],
    });
    const text = flexibleReportToPlainText(report, '2026-11-01T12:00:00.000Z');
    assert.match(text, /Питание/);
    assert.match(text, /Спорт/);
    assert.doesNotMatch(text, /стыдно|неудачник|провал/i);
  });
});

describe('reports never leak Garmin secrets (M10)', () => {
  it('day report + snapshot omit api key / bearer / JWT', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    repo.upsertSleepNight({
      dateLocal: '2026-11-01',
      sleepSec: 28800,
      deepSec: null,
      lightSec: null,
      remSec: null,
      awakeSec: null,
      sleepScore: null,
      source: 'garmin',
      externalId: 'garmin-sleep:2026-11-01',
    });
    const text = buildDayReportText({
      dateLocal: '2026-11-01',
      generatedAtIso: '2026-11-01T12:00:00.000Z',
      nutrition: {
        entryCount: 0,
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbG: null,
        hasUnknownFields: false,
      },
      waterMl: 0,
      waterTargetMl: null,
      activityMinutes: 0,
      steps: null,
      workouts: [],
      weightKg: null,
      sleep: {
        sleepSec: 28800,
        deepSec: null,
        lightSec: null,
        remSec: null,
        awakeSec: null,
        sleepScore: null,
        avgSpo2: null,
      },
      targets: { energyKcal: null, proteinG: null, fatG: null, carbG: null },
    });
    assert.doesNotMatch(text, /api[_-]?key|bearer|SecureStore|Authorization/i);
    const snap = JSON.stringify(repo.toSnapshot());
    assert.doesNotMatch(snap, /apiKey|accessToken|bearerToken|eyJ[A-Za-z0-9_-]+\./);
    assert.match(snap, /sleepNights/);
  });
});
