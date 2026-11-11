import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { createMemoryFoodRepository } = mods['storage/foodRepository'];
const {
  chunkInclusiveDateRange,
  computeSyncWindow,
  dedupeByExternalId,
  downsamplePolyline,
  groupGarminDetailFields,
  jwtExpiresAtEpoch,
  mapGarminChartSeries,
  mapGarminActivitiesResponse,
  mapGarminActivityType,
  mapGarminPolyline,
  mapGarminSleepResponse,
  mapGarminStepsResponse,
  mapGarminWeightResponse,
  mergeGarminActivityDetail,
  normalizeGarminApiKey,
  projectTrackToViewBox,
  googleMapsTrackUrl,
  shouldRefreshBearerToken,
} = mods['domain/garmin/index'];

describe('garmin mappers', () => {
  it('maps weight grams to kg and preserves external id', () => {
    const rows = mapGarminWeightResponse({
      dateWeightList: [
        { samplePk: 42, date: Date.parse('2026-08-01T08:00:00.000Z'), weight: 76400 },
        { samplePk: 42, date: Date.parse('2026-08-01T08:00:00.000Z'), weight: 76400 },
      ],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kg, 76.4);
    assert.equal(rows[0].externalId, 'garmin-weight:42');
    assert.equal(rows[0].weighedAt, '2026-08-01T08:00:00.000Z');
  });

  it('skips weight without id or invalid kg', () => {
    assert.deepEqual(mapGarminWeightResponse([{ date: Date.now(), weight: 70000 }]), []);
    assert.deepEqual(
      mapGarminWeightResponse([{ samplePk: 1, date: Date.now(), weight: 5 }]),
      [],
    );
  });

  it('maps activity types and null distance when missing', () => {
    assert.equal(mapGarminActivityType({ typeKey: 'cycling' }), 'cycling');
    assert.equal(mapGarminActivityType({ typeKey: 'strength_training' }), 'strength');
    assert.equal(mapGarminActivityType({ typeKey: 'running' }), 'walking');
    assert.equal(mapGarminActivityType({ typeKey: 'soccer' }), 'football');
    assert.equal(mapGarminActivityType({ typeKey: 'yoga' }), 'other');

    const mapped = mapGarminActivitiesResponse([
      {
        activityId: 99,
        activityName: 'Ride',
        startTimeLocal: '2026-08-10 07:15:00',
        activityType: { typeKey: 'cycling' },
        duration: 3600.4,
      },
      {
        activityId: 99,
        startTimeLocal: '2026-08-10 07:15:00',
        activityType: { typeKey: 'cycling' },
        duration: 3600,
      },
    ]);
    assert.equal(mapped.length, 1);
    assert.equal(mapped[0].type, 'cycling');
    assert.equal(mapped[0].durationSec, 3600);
    assert.equal(mapped[0].distanceM, null);
    assert.equal(mapped[0].dateLocal, '2026-08-10');
    assert.equal(mapped[0].externalId, 'garmin-activity:99');
  });

  it('skips activities without duration (unknown ≠ 0)', () => {
    assert.deepEqual(
      mapGarminActivitiesResponse([
        {
          activityId: 1,
          startTimeLocal: '2026-08-10 07:15:00',
          activityType: { typeKey: 'walking' },
        },
      ]),
      [],
    );
  });

  it('maps steps and keeps nulls for missing kcal', () => {
    const rows = mapGarminStepsResponse([
      { calendarDate: '2026-08-11', totalSteps: 8123, totalDistance: 6100.5 },
      { calendarDate: '2026-08-11', totalSteps: 8123 },
      { calendarDate: '2026-08-12' },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].steps, 8123);
    assert.equal(rows[0].distanceM, 6100.5);
    assert.equal(rows[0].activeKcal, null);
    assert.equal(rows[0].externalId, 'garmin-steps:2026-08-11');
  });

  it('maps sleep summaries and keeps unknown stages null', () => {
    const rows = mapGarminSleepResponse([
      {
        calendarDate: '2026-08-11',
        sleepTimeSeconds: 25200,
        deepSleepSeconds: 5400,
        lightSleepSeconds: 14400,
        remSleepSeconds: 4200,
        awakeSleepSeconds: 1200,
        overallSleepScore: 81,
      },
      { calendarDate: '2026-08-11', sleepTimeSeconds: 25200 },
      { calendarDate: '2026-08-12' },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].sleepSec, 25200);
    assert.equal(rows[0].deepSec, 5400);
    assert.equal(rows[0].sleepScore, 81);
    assert.equal(rows[0].externalId, 'garmin-sleep:2026-08-11');
  });

  it('maps Personal API sleepScores.overall.value and wrappers', () => {
    const fromScores = mapGarminSleepResponse([
      {
        calendarDate: '2026-11-02',
        sleepTimeSeconds: 28260,
        deepSleepSeconds: 3840,
        lightSleepSeconds: 22980,
        remSleepSeconds: 5280,
        awakeSleepSeconds: 3060,
        sleepScores: { overall: { value: 80 } },
        avgSleepRespiration: 14.2,
      },
    ]);
    assert.equal(fromScores.length, 1);
    assert.equal(fromScores[0].sleepScore, 80);
    assert.equal(fromScores[0].avgRespiration, 14.2);

    const wrapped = mapGarminSleepResponse({
      dailySleepDTOList: [
        {
          calendarDate: '2026-11-03',
          sleepTimeSeconds: 25000,
          sleepScores: { overallScore: 72 },
        },
      ],
    });
    assert.equal(wrapped.length, 1);
    assert.equal(wrapped[0].dateLocal, '2026-11-03');
    assert.equal(wrapped[0].sleepScore, 72);

    const dated = mapGarminSleepResponse({
      '2026-11-04': {
        sleepTimeSeconds: 26000,
        deepSleepSeconds: 4000,
        lightSleepSeconds: 15000,
        remSleepSeconds: 7000,
      },
    });
    assert.equal(dated.length, 1);
    assert.equal(dated[0].dateLocal, '2026-11-04');
    assert.equal(dated[0].deepSec, 4000);
  });

  it('maps cycling power, hr zones and merges detail payload', () => {
    const mapped = mapGarminActivitiesResponse([
      {
        activityId: 77,
        activityName: 'Evening Ride',
        startTimeLocal: '2026-08-10 19:00:00',
        activityType: { typeKey: 'cycling' },
        duration: 5400,
        distance: 42000,
        calories: 890,
        averageHR: 142,
        maxHR: 171,
        avgPower: 180,
        maxPower: 420,
        normPower: 195,
        avgBikeCadence: 88,
        elevationGain: 310,
        averageSpeed: 7.7,
        heartRateZones: [
          { zoneNumber: 1, secsInZone: 600 },
          { zoneNumber: 2, secsInZone: 2400 },
        ],
      },
    ]);
    assert.equal(mapped.length, 1);
    assert.equal(mapped[0].type, 'cycling');
    assert.equal(mapped[0].calories, 890);
    assert.equal(mapped[0].avgPowerW, 180);
    assert.equal(mapped[0].normalizedPowerW, 195);
    assert.equal(mapped[0].hrZones?.length, 2);

    const merged = mergeGarminActivityDetail(mapped[0], {
      activityId: 77,
      activityName: 'Evening Ride',
      startTimeLocal: '2026-08-10 19:00:00',
      activityType: { typeKey: 'cycling' },
      duration: 5400,
      summaryDTO: {
        activityId: 77,
        startTimeLocal: '2026-08-10 19:00:00',
        duration: 5400,
        avgPower: 185,
        calories: 910,
      },
    });
    assert.equal(merged.avgPowerW, 185);
    assert.equal(merged.calories, 910);
  });

  it('chunks inclusive ranges to Garmin 28-day max', () => {
    const chunks = chunkInclusiveDateRange('2026-08-01', '2026-09-10', 28);
    assert.deepEqual(chunks, [
      { startDate: '2026-08-01', endDate: '2026-08-28' },
      { startDate: '2026-08-29', endDate: '2026-09-10' },
    ]);
  });

  it('maps polyline and downsamples', () => {
    const poly = mapGarminPolyline({
      geoPolylineDTO: {
        startPoint: { lat: 55.75, lon: 37.61 },
        endPoint: { lat: 55.76, lon: 37.62 },
        polyline: [
          { lat: 55.75, lon: 37.61 },
          { lat: 55.751, lon: 37.611 },
          { lat: 55.752, lon: 37.612 },
          { lat: 55.76, lon: 37.62 },
        ],
      },
    });
    assert.ok(poly);
    assert.equal(poly.points.length, 4);
    assert.equal(poly.start.lat, 55.75);
    assert.equal(downsamplePolyline(poly.points, 2).length, 2);
  });

  it('maps chart series from metricDescriptors', () => {
    const charts = mapGarminChartSeries({
      metricDescriptors: [
        { metricsIndex: 0, key: 'directTimestamp' },
        { metricsIndex: 1, key: 'directHeartRate' },
        { metricsIndex: 2, key: 'directPower' },
      ],
      activityDetailMetrics: [
        { metrics: [1000, 120, 180] },
        { metrics: [1001, 125, 190] },
        { metrics: [1002, 130, 200] },
      ],
    });
    assert.ok(charts);
    assert.equal(charts.series.length, 2);
    assert.equal(charts.series[0].key, 'heartRate');
    assert.equal(charts.series[0].samples.length, 3);
  });

  it('labels Garmin fields in Russian groups', () => {
    const labeled = groupGarminDetailFields({
      avgPower: 180,
      averageHR: 142,
      mysteryField: 1,
    });
    assert.equal(labeled.find((x) => x.key === 'avgPower')?.labelRu.includes('мощность'), true);
    assert.equal(labeled.find((x) => x.key === 'averageHR')?.group, 'heart');
    assert.equal(labeled.find((x) => x.key === 'mysteryField')?.group, 'other');
  });

  it('projects track and builds map deeplink', () => {
    const poly = mapGarminPolyline({
      geoPolylineDTO: {
        startPoint: { lat: 55.75, lon: 37.61 },
        endPoint: { lat: 55.76, lon: 37.62 },
        polyline: [
          { lat: 55.75, lon: 37.61 },
          { lat: 55.76, lon: 37.62 },
        ],
      },
    });
    assert.ok(poly);
    const projected = projectTrackToViewBox(poly, 100, 80);
    assert.ok(projected);
    assert.match(projected.pointsAttr, /,/);
    const url = googleMapsTrackUrl(poly);
    assert.match(url, /google\.com\/maps\/dir/);
  });
});

describe('garmin sync helpers', () => {
  it('normalizes pasted api keys', () => {
    assert.equal(normalizeGarminApiKey('  abcDEF1234567890  '), 'abcDEF1234567890');
    assert.equal(normalizeGarminApiKey('"abcDEF1234567890"'), 'abcDEF1234567890');
    assert.equal(normalizeGarminApiKey("ApiKey abcDEF1234567890"), 'abcDEF1234567890');
    assert.equal(normalizeGarminApiKey('[abcDEF1234567890]'), 'abcDEF1234567890');
  });

  it('computes initial 3-year window and incremental overlap', () => {
    const initial = computeSyncWindow({ todayLocal: '2026-11-01', lastSyncedTo: null });
    assert.equal(initial.isInitial, true);
    assert.equal(initial.endDate, '2026-11-01');
    assert.equal(initial.startDate, '2023-11-03');

    const full = computeSyncWindow({
      todayLocal: '2026-11-01',
      lastSyncedTo: '2026-10-28',
      mode: 'full',
    });
    assert.equal(full.isInitial, true);
    assert.equal(full.startDate, '2023-11-03');

    const incr = computeSyncWindow({
      todayLocal: '2026-11-01',
      lastSyncedTo: '2026-10-28',
    });
    assert.equal(incr.isInitial, false);
    assert.equal(incr.startDate, '2026-10-28');
    assert.equal(incr.endDate, '2026-11-01');
  });

  it('parses jwt exp and refresh window', () => {
    const payload = Buffer.from(JSON.stringify({ exp: 1_700_000_000 })).toString('base64url');
    const token = `x.${payload}.y`;
    assert.equal(jwtExpiresAtEpoch(token), 1_700_000_000);
    assert.equal(shouldRefreshBearerToken(1_700_000_000, 1_700_000_000 - 30 * 60), true);
    assert.equal(shouldRefreshBearerToken(1_700_000_000, 1_700_000_000 - 2 * 60 * 60), false);
  });

  it('dedupes by externalId', () => {
    assert.deepEqual(
      dedupeByExternalId([
        { externalId: 'a', n: 1 },
        { externalId: 'a', n: 2 },
        { externalId: 'b', n: 3 },
      ]),
      [
        { externalId: 'a', n: 1 },
        { externalId: 'b', n: 3 },
      ],
    );
  });
});

describe('garmin repository upsert', () => {
  it('upserts garmin weight/workout/steps idempotently without touching user rows', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    assert.equal(repo.toSnapshot().version, 19);

    const manual = repo.addWeight(80, '2026-08-01T10:00:00.000Z');
    assert.equal(manual.source, 'user');

    const w1 = repo.upsertIntegratedWeight({
      kg: 76.4,
      weighedAt: '2026-08-01T08:00:00.000Z',
      source: 'garmin',
      externalId: 'garmin-weight:42',
    });
    const w2 = repo.upsertIntegratedWeight({
      kg: 76.5,
      weighedAt: '2026-08-01T08:05:00.000Z',
      source: 'garmin',
      externalId: 'garmin-weight:42',
    });
    assert.ok(w1);
    assert.ok(w2);
    assert.equal(w1.id, w2.id);
    assert.equal(w2.kg, 76.5);
    assert.equal(repo.listWeights(10).filter((x) => x.source === 'user').length, 1);

    const a1 = repo.upsertIntegratedWorkout({
      dateLocal: '2026-08-10',
      type: 'cycling',
      durationSec: 3600,
      distanceM: 20000,
      notes: 'Ride',
      source: 'garmin',
      externalId: 'garmin-activity:99',
      calories: 800,
      avgPowerW: 170,
      hrZones: [{ zone: 2, secs: 1200 }],
      detailJson: '{"fields":{"avgPower":170}}',
    });
    const a2 = repo.upsertIntegratedWorkout({
      dateLocal: '2026-08-10',
      type: 'cycling',
      durationSec: 3700,
      distanceM: 20100,
      notes: 'Ride',
      source: 'garmin',
      externalId: 'garmin-activity:99',
      calories: 820,
      avgPowerW: 175,
      hrZones: [
        { zone: 2, secs: 1000 },
        { zone: 3, secs: 900 },
      ],
      detailJson: '{"fields":{"avgPower":175}}',
      polylineJson: '{"points":[{"lat":55.75,"lon":37.61}],"start":null,"end":null,"bbox":null}',
      chartJson: '{"series":[{"key":"heartRate","labelRu":"Пульс","unit":"уд/м","samples":[{"t":0,"v":120},{"t":1,"v":130}]}]}',
    });
    assert.ok(a1 && a2);
    assert.equal(a1.id, a2.id);
    assert.equal(a2.durationSec, 3700);
    assert.equal(a2.calories, 820);
    assert.equal(a2.avgPowerW, 175);
    assert.equal(a2.hrZones?.length, 2);
    assert.equal(repo.getWorkoutById(a2.id)?.detailJson?.includes('175'), true);
    assert.equal(repo.getWorkoutById(a2.id)?.polylineJson?.includes('55.75'), true);
    assert.equal(repo.getWorkoutById(a2.id)?.chartJson?.includes('heartRate'), true);
    assert.equal(repo.listWorkoutsForDate('2026-08-10').length, 1);

    repo.upsertDailyActivityStats({
      dateLocal: '2026-08-11',
      steps: 8000,
      distanceM: null,
      activeKcal: null,
      source: 'garmin',
      externalId: 'garmin-steps:2026-08-11',
    });
    repo.upsertDailyActivityStats({
      dateLocal: '2026-08-11',
      steps: 8123,
      source: 'garmin',
      externalId: 'garmin-steps:2026-08-11',
    });
    const stats = repo.getDailyActivityStats('2026-08-11');
    assert.equal(stats?.steps, 8123);
    assert.equal(stats?.distanceM, null);

    repo.setGarminSyncState({
      lastSuccessfulSyncAt: '2026-11-01T12:00:00.000Z',
      lastSyncedFrom: '2026-08-04',
      lastSyncedTo: '2026-11-01',
      lastError: null,
      lastAttemptAt: '2026-11-01T12:00:00.000Z',
    });
    assert.equal(repo.getGarminSyncState().lastSyncedTo, '2026-11-01');
    assert.equal(repo.listIntegratedWeights('garmin').length, 1);
    assert.equal(repo.listIntegratedWorkouts('garmin').length, 1);
    assert.equal(repo.listIntegratedDailyActivityStats('garmin').length, 1);
  });

  it('refuses to upsert with empty externalId or source user', () => {
    const repo = createMemoryFoodRepository({ timezone: 'UTC' });
    assert.equal(
      repo.upsertIntegratedWeight({
        kg: 70,
        weighedAt: '2026-08-01T08:00:00.000Z',
        source: 'garmin',
        externalId: '  ',
      }),
      null,
    );
    assert.equal(
      repo.upsertIntegratedWorkout({
        dateLocal: '2026-08-10',
        type: 'walking',
        durationSec: 600,
        source: 'user',
        externalId: 'x',
      }),
      null,
    );
  });
});
