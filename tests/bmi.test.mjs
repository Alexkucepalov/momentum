import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { computeBmi, bmiBand, formatBmi } = mods['domain/bmi'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('computeBmi for 70kg / 175cm', () => {
  const bmi = computeBmi(70, 175);
  assert.ok(Math.abs(bmi - 22.857) < 0.01);
  assert.equal(formatBmi(bmi), '22.9');
  assert.equal(bmiBand(bmi).id, 'normal');
});

test('bmi bands are WHO-style without inventing values', () => {
  assert.equal(bmiBand(17).id, 'underweight');
  assert.equal(bmiBand(26).id, 'overweight');
  assert.equal(bmiBand(31).id, 'obesity');
});

test('profile daily targets and height migrate to v6', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 5,
      profile: {
        id: 'p',
        timezone: 'UTC',
        locale: 'en',
        units: 'metric',
        waterTargetMl: 2000,
        dogfoodStartedOn: null,
      },
      products: [],
      recipes: [],
      ingredients: [],
      entries: [],
    },
  });
  assert.equal(repo.getProfile().heightCm, null);
  assert.equal(repo.getProfile().dailyEnergyKcal, null);
  repo.setHeightCm(180);
  repo.setDailyNutritionTargets({
    energyKcal: 2200,
    proteinG: 140,
    fatG: 70,
    carbG: 220,
  });
  const p = repo.getProfile();
  assert.equal(p.heightCm, 180);
  assert.equal(p.dailyEnergyKcal, 2200);
  assert.equal(p.dailyProteinG, 140);
  assert.equal(repo.toSnapshot().version, 9);
});
