import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const { createAddGuard } = loadSrcModules()['domain/addGuard'];

test('createAddGuard allows then blocks within cooldown', () => {
  const g = createAddGuard(500);
  assert.equal(g.tryAllow(1000), true);
  assert.equal(g.tryAllow(1100), false);
  assert.equal(g.tryAllow(1499), false);
  assert.equal(g.tryAllow(1500), true);
});

test('rapid five presses → one allow', () => {
  const g = createAddGuard(500);
  let allowed = 0;
  for (let i = 0; i < 5; i++) {
    if (g.tryAllow(10_000 + i * 10)) allowed += 1;
  }
  assert.equal(allowed, 1);
});

test('intentional second add after cooldown is allowed', () => {
  const g = createAddGuard(500);
  assert.equal(g.tryAllow(0), true);
  // Same product again after flash / user pause (≥ cooldown)
  assert.equal(g.tryAllow(500), true);
  assert.equal(g.tryAllow(600), false);
});

test('reset clears lock for next intentional add', () => {
  const g = createAddGuard(5000);
  assert.equal(g.tryAllow(0), true);
  assert.equal(g.tryAllow(10), false);
  g.reset();
  assert.equal(g.tryAllow(20), true);
});

test('invalid cooldown rejected', () => {
  assert.throws(() => createAddGuard(-1));
});
