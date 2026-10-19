import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const {
  loadPersonalRecipeImportFile,
  previewPersonalRecipes,
  buildPersonalRecipeDraft,
  stablePersonalRecipeId,
} = mods['domain/personalRecipeImport'];
const { createMemoryFoodRepository } = mods['storage/foodRepository'];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(
  readFileSync(join(root, 'docs/fixtures/personal-recipes-expanded.json'), 'utf8'),
);

test('pack loads and previews without inventing calories', () => {
  const file = loadPersonalRecipeImportFile(pack);
  assert.equal(file.format, 'momentum.recipe_import.v1');
  const previews = previewPersonalRecipes(file);
  assert.ok(previews.length >= 30);
  const cake = previews.find((p) => p.importKey === 'cheesecake-600-no-semolina');
  assert.ok(cake);
  assert.equal(cake.verifiedByUser, true);
  assert.ok(cake.knownGramCount >= 1);
  assert.ok(cake.missingQuantityCount >= 1);
  assert.ok(cake.warnings.some((w) => /грамм/i.test(w)));
});

test('draft keeps unknown grams out of ingredients (not zero)', () => {
  const file = loadPersonalRecipeImportFile(pack);
  const raw = file.recipes.find((r) => r.id === 'cheesecake-600-no-semolina');
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const draft = buildPersonalRecipeDraft(raw, repo.listProducts());
  assert.ok(draft);
  assert.ok(draft.ingredients.every((i) => i.rawGrams > 0));
  assert.ok(draft.ingredients.every((i) => i.nutritionPer100g.kcal == null || Number.isFinite(i.nutritionPer100g.kcal)));
  // Eggs in pcs must not become fabricated grams rows.
  assert.ok(!draft.ingredients.some((i) => /яйц/i.test(i.displayName)));
  assert.match(draft.description, /Яйцо|желт/i);
});

test('importRecipeIfAbsent is idempotent and does not touch diary', () => {
  const file = loadPersonalRecipeImportFile(pack);
  const raw = file.recipes.find((r) => r.id === 'cheesecake-600-no-semolina');
  const repo = createMemoryFoodRepository({ timezone: 'UTC' });
  const draft = buildPersonalRecipeDraft(raw, repo.listProducts());
  assert.ok(draft);
  const id = stablePersonalRecipeId(raw.id);
  const first = repo.importRecipeIfAbsent(id, {
    name: draft.name,
    cookedYieldG: draft.cookedYieldG,
    description: draft.description,
    instructions: draft.instructions,
    nutritionPer100g: null,
    ingredients: draft.ingredients,
  });
  assert.equal(first.created, true);
  const entriesBefore = repo.listEntriesForDate('2026-10-19').length;
  const second = repo.importRecipeIfAbsent(id, {
    name: draft.name,
    cookedYieldG: draft.cookedYieldG,
    description: draft.description,
    instructions: draft.instructions,
    nutritionPer100g: null,
    ingredients: draft.ingredients,
  });
  assert.equal(second.created, false);
  assert.equal(repo.getRecipe(id)?.name, draft.name);
  assert.equal(repo.listEntriesForDate('2026-10-19').length, entriesBefore);
});

test('assistant-only with no grams cannot build draft', () => {
  const file = loadPersonalRecipeImportFile(pack);
  const raw = file.recipes.find((r) => r.id === 'oat-pancake');
  assert.ok(raw);
  const draft = buildPersonalRecipeDraft(raw, []);
  assert.equal(draft, null);
});
