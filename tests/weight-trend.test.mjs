import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { weightSparkline, weightLinePoints, chronologicalKg } =
  loadSrcModules()['domain/weightTrend'];

test('empty and single point', () => {
  assert.deepEqual(weightSparkline([]), []);
  assert.equal(weightSparkline([72]).length, 1);
  assert.equal(weightSparkline([72])[0].height, 0.5);
});

test('chronological + relative heights', () => {
  const pts = weightSparkline(chronologicalKg([74, 73, 72])); // newest first input
  assert.equal(pts[0].kg, 72);
  assert.equal(pts[2].kg, 74);
  assert.ok(pts[0].height < pts[2].height);
});

test('flat series mid height', () => {
  const pts = weightSparkline([70, 70, 70]);
  assert.ok(pts.every((p) => p.height === 0.5));
});

test('weightLinePoints empty and single', () => {
  assert.deepEqual(weightLinePoints([]), []);
  const one = weightLinePoints([72]);
  assert.equal(one.length, 1);
  assert.equal(one[0].x, 0.5);
  assert.equal(one[0].y, 0.5);
});

test('weightLinePoints x rises and y tracks kg', () => {
  const pts = weightLinePoints(chronologicalKg([74, 73, 72]));
  assert.equal(pts[0].kg, 72);
  assert.equal(pts[2].kg, 74);
  assert.ok(pts[0].x < pts[1].x && pts[1].x < pts[2].x);
  assert.ok(pts[0].y < pts[2].y);
  assert.equal(pts[0].x, 0);
  assert.equal(pts[2].x, 1);
});

test('weightLinePoints flat series mid y', () => {
  const pts = weightLinePoints([70, 70, 70]);
  assert.ok(pts.every((p) => p.y === 0.5));
  assert.equal(pts[0].x, 0);
  assert.equal(pts[2].x, 1);
});
