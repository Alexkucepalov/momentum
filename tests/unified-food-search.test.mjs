import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';

const mods = loadSrcModules();
const { unifiedFoodSearch } = mods['domain/unifiedFoodSearch'];

test('unified search ranks recent and mixes products + recipes', () => {
  const hits = unifiedFoodSearch({
    query: 'овс',
    products: [
      {
        id: 'p1',
        name: 'Овёс цельный',
        brand: null,
        barcode: null,
        energyKcal: 100,
        proteinG: 10,
        fatG: 2,
        carbG: 20,
        source: 'user',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    recipes: [
      {
        id: 'r1',
        name: 'Каша из овса',
        cookedYieldG: 400,
        description: null,
        photoUri: null,
        energyKcalPer100g: null,
        proteinGPer100g: null,
        fatGPer100g: null,
        carbGPer100g: null,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    recent: [
      {
        id: 'e1',
        dateLocal: '2026-10-17',
        meal: 'breakfast',
        displayName: 'Овсянка',
        grams: 200,
        productId: 'p1',
        recipeId: null,
        energyKcal: 200,
        proteinG: 20,
        fatG: 4,
        carbG: 40,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
  });
  assert.ok(hits.length >= 2);
  assert.equal(hits[0].kind, 'recent');
  assert.ok(hits.some((h) => h.kind === 'recipe'));
});

test('empty query returns no hits', () => {
  assert.deepEqual(
    unifiedFoodSearch({ query: '  ', products: [], recipes: [], recent: [] }),
    [],
  );
});

test('recipe aliases + import: key match offline without inventing macros', () => {
  const { recipeSearchAliases } = mods['domain/unifiedFoodSearch'];
  const importRecipe = {
    id: 'import:chicken-bowl-lunch',
    name: 'Боул с курицей',
    cookedYieldG: 500,
    description: 'рис и овощи',
    instructions: null,
    photoUri: null,
    energyKcalPer100g: null,
    proteinGPer100g: null,
    fatGPer100g: null,
    carbGPer100g: null,
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
  };
  const aliases = recipeSearchAliases(importRecipe);
  assert.ok(aliases.some((a) => a.includes('куриц') || a === 'курицей'));
  assert.ok(aliases.some((a) => a.includes('chicken') || a.includes('bowl')));

  const hitsByAlias = unifiedFoodSearch({
    query: 'chicken',
    products: [],
    recipes: [importRecipe],
    recent: [],
  });
  assert.ok(hitsByAlias.some((h) => h.kind === 'recipe' && h.recipe.id === importRecipe.id));

  // Token from RU name still finds recipe; products keep separate ranking.
  const hitsRu = unifiedFoodSearch({
    query: 'боул',
    products: [
      {
        id: 'p1',
        name: 'Боул микс сухой',
        brand: null,
        barcode: null,
        energyKcal: 100,
        proteinG: 10,
        fatG: 1,
        carbG: 10,
        source: 'user',
        isFavorite: false,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
      },
    ],
    recipes: [importRecipe],
    recent: [],
  });
  assert.ok(hitsRu.some((h) => h.kind === 'product'));
  assert.ok(hitsRu.some((h) => h.kind === 'recipe'));
  const recipeHit = hitsRu.find((h) => h.kind === 'recipe');
  assert.equal(recipeHit.recipe.energyKcalPer100g, null);
});
