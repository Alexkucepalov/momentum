import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { RecipeEditorForm } from '@/src/features/recipes/RecipeEditorForm';
import { RecipeHubActions } from '@/src/features/recipes/RecipeHubActions';
import { consumeRecipeImportDraft } from '@/src/features/recipes/recipeImportDraft';
import { persistRecipePhoto } from '@/src/media/recipePhoto';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, type } from '@/src/theme/tokens';

export default function NewRecipeScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const [fromImport] = useState(() => consumeRecipeImportDraft());
  const initial = useMemo(() => fromImport ?? undefined, [fromImport]);

  return (
    <FormScrollView style={styles.root} contentContainerStyle={styles.content}>
      {fromImport ? (
        <View style={styles.banner} accessibilityRole="summary">
          <Text style={styles.bannerTitle}>Черновик из текста</Text>
          <Text style={styles.bannerBody}>
            Проверь название, выход и граммы. Пустые КБЖУ — это нормально: не подставляем нули.
            Сохрани, когда всё ок.
          </Text>
        </View>
      ) : (
        <View style={styles.alt}>
          <Text style={styles.altTitle}>Другие способы</Text>
          <RecipeHubActions compact omit={['manual']} />
          <Text style={styles.altHint}>Или заполни форму ниже с нуля.</Text>
        </View>
      )}
      <RecipeEditorForm
        key={fromImport ? 'imported' : 'blank'}
        initial={initial}
        submitLabel="Сохранить рецепт"
        onSubmit={(values) => {
          void (async () => {
            const recipe = repo.createRecipe({
              name: values.name,
              cookedYieldG: values.cookedYieldG,
              description: values.description,
              instructions: values.instructions,
              photoUri: null,
              nutritionPer100g: values.nutritionPer100g,
              ingredients: values.ingredients,
            });
            let photoUri = values.photoUri;
            if (photoUri) {
              try {
                photoUri = await persistRecipePhoto(photoUri, recipe.id);
                repo.updateRecipe(recipe.id, { photoUri });
              } catch {
                repo.updateRecipe(recipe.id, { photoUri: values.photoUri });
              }
            }
            refresh();
            showFlash(`Рецепт сохранён: ${recipe.name}`);
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
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerTitle: { fontWeight: '800', fontSize: type.subtitle, color: colors.text },
  bannerBody: {
    marginTop: 4,
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  alt: { marginBottom: space.md },
  altTitle: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: space.sm,
  },
  altHint: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginTop: space.xs,
  },
});
