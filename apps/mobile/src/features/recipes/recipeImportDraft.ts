import type { RecipeFormInitial } from './RecipeEditorForm';

/** One-shot draft handoff: import screen → /recipes/new (avoids huge router params). */
let pending: RecipeFormInitial | null = null;

export function setRecipeImportDraft(draft: RecipeFormInitial): void {
  pending = draft;
}

export function consumeRecipeImportDraft(): RecipeFormInitial | null {
  const next = pending;
  pending = null;
  return next;
}
