export type AddFoodTab =
  | 'recent'
  | 'favorites'
  | 'recipes'
  | 'manual'
  | 'quick'
  | 'meals';

/** Primary catalog tabs (search covers full catalog — no separate «Все»). */
export const PRIMARY_ADD_FOOD_TABS: Array<{
  id: Extract<AddFoodTab, 'recent' | 'favorites' | 'recipes'>;
  label: string;
}> = [
  { id: 'recent', label: 'Недавние' },
  { id: 'favorites', label: 'Избранное' },
  { id: 'recipes', label: 'Рецепты' },
];

export type DraftIngredient = {
  key: string;
  displayName: string;
  rawGrams: string;
  kcalPer100: string;
  proteinPer100: string;
  fatPer100: string;
  carbPer100: string;
};

export function emptyIngredient(): DraftIngredient {
  return {
    key: `ing-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    displayName: '',
    rawGrams: '',
    kcalPer100: '',
    proteinPer100: '',
    fatPer100: '',
    carbPer100: '',
  };
}
