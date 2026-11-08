import { StyleSheet, View } from 'react-native';

import {
  isEstimatedCookedYield,
  nutritionForRecipePortion,
  recipeHasManualPer100g,
} from '../../../../../src/domain/recipeNutrition';
import type { Recipe, RecipeIngredient } from '../../../../../src/storage/types';
import { AppText, MetricCard, space } from '@/src/design-system';

type RecipeNutritionSummaryProps = {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  /** Served grams used for preview (default 100g). */
  servedGrams?: number;
  testID?: string;
};

/**
 * Per-portion nutrition for a recipe. Unknown macros stay "—" — never invented.
 */
export function RecipeNutritionSummary({
  recipe,
  ingredients,
  servedGrams = 100,
  testID = 'recipe-nutrition-summary',
}: RecipeNutritionSummaryProps) {
  let preview: ReturnType<typeof nutritionForRecipePortion> | null = null;
  try {
    preview = nutritionForRecipePortion(recipe, ingredients, servedGrams);
  } catch {
    preview = null;
  }

  const estimatedYield = isEstimatedCookedYield(recipe.cookedYieldG, ingredients);
  const sourceMeta =
    ingredients.length === 0 && !recipeHasManualPer100g(recipe)
      ? 'КБЖУ неизвестны — не выдуманы'
      : recipeHasManualPer100g(recipe)
        ? estimatedYield
          ? `ручные на 100 г · выход расчётный ${recipe.cookedYieldG} г`
          : 'ручные значения на 100 г'
        : estimatedYield
          ? `из ингредиентов · выход расчётный ${recipe.cookedYieldG} г (сумма масс)`
          : `из ингредиентов · выход ${recipe.cookedYieldG} г`;

  return (
    <View style={styles.wrap} testID={testID} accessibilityLabel="Питание рецепта на порцию">
      <AppText variant="label" tone="secondary">
        На {servedGrams} г
      </AppText>
      <MetricCard
        label="Энергия"
        value={preview?.kcal ?? null}
        unit="ккал"
        meta={sourceMeta}
        testID={`${testID}-energy`}
      />
      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <MetricCard
            label="Белки"
            value={preview?.protein ?? null}
            unit="г"
            testID={`${testID}-protein`}
          />
        </View>
        <View style={styles.macroItem}>
          <MetricCard
            label="Жиры"
            value={preview?.fat ?? null}
            unit="г"
            testID={`${testID}-fat`}
          />
        </View>
        <View style={styles.macroItem}>
          <MetricCard
            label="Углев."
            value={preview?.carbs ?? null}
            unit="г"
            testID={`${testID}-carb`}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
  macros: {
    flexDirection: 'row',
    gap: space.sm,
  },
  macroItem: {
    flex: 1,
  },
});
