import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { shouldShowTargetsOnboarding, hasNoDailyTargets } = mods['domain/targetsOnboarding'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

test('UX-03: fresh profile shows onboarding; skip does not invent targets', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const p0 = repo.getProfile();
  assert.equal(hasNoDailyTargets(p0), true);
  assert.equal(shouldShowTargetsOnboarding(p0), true);
  assert.equal(p0.targetsPromptDismissedAt, null);

  repo.dismissTargetsOnboardingPrompt();
  const p1 = repo.getProfile();
  assert.ok(p1.targetsPromptDismissedAt);
  assert.equal(p1.dailyEnergyKcal, null);
  assert.equal(p1.dailyProteinG, null);
  assert.equal(shouldShowTargetsOnboarding(p1), false);
});

test('UX-03: setting targets hides onboarding without dismiss flag required', () => {
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  repo.setDailyNutritionTargets({
    energyKcal: 2200,
    proteinG: null,
    fatG: null,
    carbG: null,
  });
  const p = repo.getProfile();
  assert.equal(p.dailyEnergyKcal, 2200);
  assert.equal(shouldShowTargetsOnboarding(p), false);
});

test('UX-03: legacy snapshot without dismissed field normalizes to null', () => {
  const repo = createMemoryFoodRepository({
    snapshot: {
      version: 14,
      profile: {
        id: 'p',
        timezone: 'UTC',
        locale: 'en',
        units: 'metric',
      },
      products: [],
      recipes: [],
      ingredients: [],
      entries: [],
    },
  });
  assert.equal(repo.getProfile().targetsPromptDismissedAt, null);
  assert.equal(shouldShowTargetsOnboarding(repo.getProfile()), true);
});
