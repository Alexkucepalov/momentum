import {
  buildPersonalRecipeDraft,
  loadPersonalRecipeImportFile,
  previewPersonalRecipes,
  type PersonalRecipeImportFile,
  type PersonalRecipePreview,
} from '../../../../../src/domain/personalRecipeImport';
import type { FoodProduct } from '../../../../../src/storage/types';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';

// Bundled personal archive — review before save (not a silent dump).
import packJson from '../../fixtures/personalRecipesExpanded.json';

export function getPersonalRecipesPack(): PersonalRecipeImportFile {
  return loadPersonalRecipeImportFile(packJson);
}

export function listPersonalRecipePreviews(): PersonalRecipePreview[] {
  return previewPersonalRecipes(getPersonalRecipesPack());
}

export function importSelectedPersonalRecipes(
  repo: FoodRepository,
  importKeys: string[],
): { created: number; skipped: number; failed: string[] } {
  const file = getPersonalRecipesPack();
  const byId = new Map(file.recipes.map((r) => [r.id, r]));
  const products = repo.listProducts();
  let created = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const key of importKeys) {
    const raw = byId.get(key);
    if (!raw) {
      failed.push(key);
      continue;
    }
    const draft = buildPersonalRecipeDraft(raw, products as FoodProduct[]);
    if (!draft) {
      failed.push(key);
      continue;
    }
    const result = repo.importRecipeIfAbsent(draft.stableRecipeId, {
      name: draft.name,
      cookedYieldG: draft.cookedYieldG,
      description: draft.description,
      instructions: draft.instructions,
      nutritionPer100g: null,
      ingredients: draft.ingredients,
    });
    if (result.created) created += 1;
    else skipped += 1;
  }

  return { created, skipped, failed };
}
