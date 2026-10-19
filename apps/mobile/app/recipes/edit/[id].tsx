import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { RecipeEditorForm } from '@/src/features/recipes/RecipeEditorForm';
import { persistRecipePhoto } from '@/src/media/recipePhoto';
import { useData } from '@/src/state/DataContext';
import { emptyIngredient } from '@/src/features/diary/addFood/types';
import { colors, space, type } from '@/src/theme/tokens';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, refresh, showFlash, revision } = useData();
  void revision;

  const recipe = id ? repo.getRecipe(id) : null;
  const ingredients = id ? repo.getRecipeIngredients(id) : [];

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Рецепт не найден</Text>
      </View>
    );
  }

  return (
    <FormScrollView style={styles.root} contentContainerStyle={styles.content}>
      <RecipeEditorForm
        submitLabel="Сохранить изменения"
        initial={{
          name: recipe.name,
          cookedYieldG: recipe.cookedYieldG,
          description: recipe.description,
          instructions: recipe.instructions,
          photoUri: recipe.photoUri,
          energyKcalPer100g: recipe.energyKcalPer100g,
          proteinGPer100g: recipe.proteinGPer100g,
          fatGPer100g: recipe.fatGPer100g,
          carbGPer100g: recipe.carbGPer100g,
          ingredients: ingredients.length
            ? ingredients.map((ing) => ({
                key: ing.id,
                displayName: ing.displayName,
                rawGrams: String(ing.rawGrams),
                kcalPer100: ing.energyKcal === null ? '' : String(ing.energyKcal),
                proteinPer100: ing.proteinG === null ? '' : String(ing.proteinG),
                fatPer100: ing.fatG === null ? '' : String(ing.fatG),
                carbPer100: ing.carbG === null ? '' : String(ing.carbG),
              }))
            : [emptyIngredient()],
        }}
        onSubmit={(values) => {
          void (async () => {
            let photoUri = values.photoUri;
            if (photoUri && photoUri !== recipe.photoUri) {
              try {
                photoUri = await persistRecipePhoto(photoUri, recipe.id);
              } catch {
                // keep uri
              }
            }
            repo.updateRecipe(recipe.id, {
              name: values.name,
              cookedYieldG: values.cookedYieldG,
              description: values.description,
              instructions: values.instructions,
              photoUri,
              nutritionPer100g: values.nutritionPer100g,
              ingredients: values.ingredients,
            });
            refresh();
            showFlash('Рецепт обновлён');
            router.replace(`/recipes/${recipe.id}`);
          })();
        }}
      />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg },
  missing: { flex: 1, padding: space.xl, justifyContent: 'center' },
  missingTitle: { fontSize: type.title, fontWeight: '700', color: colors.text },
});
