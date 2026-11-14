import { getLocalDataWipeEpoch } from '../../../../src/domain/localDataWipeEpoch';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { RecipeEditorForm } from '@/src/features/recipes/RecipeEditorForm';
import { RecipeHubActions } from '@/src/features/recipes/RecipeHubActions';
import { consumeRecipeImportDraft } from '@/src/features/recipes/recipeImportDraft';
import { persistRecipePhoto } from '@/src/media/recipePhoto';
import { useData } from '@/src/state/DataContext';
import { AppText, colors, radius, space } from '@/src/design-system';

export default function NewRecipeScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const [fromImport] = useState(() => consumeRecipeImportDraft());
  const initial = useMemo(() => fromImport ?? undefined, [fromImport]);

  return (
    <FormScrollView style={styles.root} contentContainerStyle={styles.content}>
      {fromImport ? (
        <View style={styles.banner} accessibilityRole="summary">
          <AppText variant="subtitle" style={styles.bannerTitle}>
            Черновик из текста
          </AppText>
          <AppText variant="caption" tone="secondary" style={styles.bannerBody}>
            Проверь название, выход и граммы. Пустые КБЖУ — это нормально: не подставляем нули.
            Сохрани, когда всё ок.
          </AppText>
        </View>
      ) : (
        <View style={styles.alt}>
          <AppText variant="label" tone="muted" style={styles.altTitle}>
            Другие способы
          </AppText>
          <RecipeHubActions compact omit={['manual']} />
          <AppText variant="caption" tone="muted" style={styles.altHint}>
            Или заполни форму ниже с нуля.
          </AppText>
        </View>
      )}
      <RecipeEditorForm
        key={fromImport ? 'imported' : 'blank'}
        initial={initial}
        submitLabel="Сохранить рецепт"
        onSubmit={async (values) => {
          const epoch = getLocalDataWipeEpoch();
          // Persist optional media before committing the recipe. A failed copy leaves the form intact.
          const photoUri = values.photoUri
            ? await persistRecipePhoto(values.photoUri, `recipe-${Date.now()}`)
            : null;
          if (epoch !== getLocalDataWipeEpoch()) throw new Error('Данные изменились. Открой рецепт заново.');
          const recipe = repo.createRecipe({ ...values, photoUri });
          refresh();
          showFlash(`Рецепт сохранён: ${recipe.name}`);
          router.replace(`/recipes/${recipe.id}`);
        }}
      />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg },
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  bannerTitle: { fontWeight: '800' },
  bannerBody: { marginTop: 4, lineHeight: 18 },
  alt: { marginBottom: space.md },
  altTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: space.sm,
  },
  altHint: { marginTop: space.xs },
});
