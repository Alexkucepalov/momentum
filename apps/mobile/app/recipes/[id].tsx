import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { portion } from '../../../../src/domain/nutrition';
import { ConfirmPortionSheet } from '@/src/features/diary/ConfirmPortionSheet';
import { RecipeNutritionSummary } from '@/src/features/recipes/RecipeNutritionSummary';
import { RecookRecipeSheet } from '@/src/features/recipes/RecookRecipeSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { FlashBar } from '@/src/components/FlashBar';
import { UndoBar } from '@/src/components/UndoBar';
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  space,
  touchMin,
  type,
} from '@/src/design-system';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, dateLocal, meal, refresh, revision, showFlash, setUndo } = useData();
  const allowAdd = useAddGuard();
  void revision;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recookOpen, setRecookOpen] = useState(false);

  const recipe = id ? repo.getRecipe(id) : null;
  const ingredients = id ? repo.getRecipeIngredients(id) : [];

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <AppText variant="title">Рецепт не найден</AppText>
        <AppButton label="К списку" onPress={() => router.replace('/recipes')} />
      </View>
    );
  }

  const onDelete = () => {
    Alert.alert('Удалить рецепт?', 'Записи дневника с этим рецептом останутся как были.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          repo.softDeleteRecipe(recipe.id);
          refresh();
          showFlash('Рецепт удалён');
          router.replace('/recipes');
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {recipe.photoUri ? (
          <Image
            source={{ uri: recipe.photoUri }}
            style={styles.hero}
            accessibilityLabel={`Фото ${recipe.name}`}
          />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]}>
            <Ionicons name="restaurant-outline" size={40} color={colors.textMuted} />
          </View>
        )}

        <AppText variant="hero" style={styles.title} accessibilityRole="header">
          {recipe.name}
        </AppText>
        <AppText variant="caption" tone="secondary" style={styles.meta}>
          Выход {recipe.cookedYieldG} г готового
        </AppText>

        <View style={styles.summary}>
          <RecipeNutritionSummary recipe={recipe} ingredients={ingredients} servedGrams={100} />
        </View>

        {recipe.description ? (
          <AppCard style={styles.block}>
            <AppText variant="label" tone="muted">
              Описание
            </AppText>
            <AppText variant="body">{recipe.description}</AppText>
          </AppCard>
        ) : null}

        {recipe.instructions ? (
          <AppCard style={styles.block}>
            <AppText variant="label" tone="muted">
              Как готовить
            </AppText>
            <AppText variant="body">{recipe.instructions}</AppText>
          </AppCard>
        ) : null}

        <AppCard style={styles.block}>
          <AppText variant="label" tone="muted">
            Ингредиенты · {ingredients.length}
          </AppText>
          {ingredients.length === 0 ? (
            <AppText variant="body">
              Структурированных ингредиентов нет — КБЖУ только из ручных значений на 100 г, если
              заданы. Текст описания не считается ингредиентами.
            </AppText>
          ) : (
            ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" style={styles.ingName}>
                    {ing.displayName}
                  </AppText>
                  <AppText variant="label" tone="muted">
                    Б {ing.proteinG === null ? '—' : Math.round(ing.proteinG)} · Ж{' '}
                    {ing.fatG === null ? '—' : Math.round(ing.fatG)} · У{' '}
                    {ing.carbG === null ? '—' : Math.round(ing.carbG)}
                    {ing.energyKcal === null ? '' : ` · ${Math.round(ing.energyKcal)} ккал/100г`}
                  </AppText>
                </View>
                <AppText variant="body" tone="secondary" style={styles.ingGrams}>
                  {ing.rawGrams} г
                </AppText>
              </View>
            ))
          )}
        </AppCard>

        <View style={styles.footer}>
          <AppText variant="caption" tone="muted">
            В дневник попадёт в текущий приём: {MEAL_LABELS[meal]}
          </AppText>
          <AppButton label="Добавить порцию в дневник" onPress={() => setConfirmOpen(true)} />

          <AppButton
            label="Приготовить снова"
            variant="secondary"
            onPress={() => setRecookOpen(true)}
          />

          <AppButton
            label="Редактировать"
            variant="secondary"
            onPress={() => router.push(`/recipes/edit/${recipe.id}`)}
          />

          <Pressable
            style={styles.deleteBtn}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Удалить рецепт"
          >
            <AppText variant="caption" tone="danger">
              Удалить рецепт
            </AppText>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmPortionSheet
        visible={confirmOpen}
        target={{ kind: 'recipe', recipe, ingredients }}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={Math.min(200, recipe.cookedYieldG)}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(result) => {
          if (!allowAdd()) return;
          const snap = portion(
            {
              kcal: result.per100g.energyKcal,
              protein: result.per100g.proteinG,
              fat: result.per100g.fatG,
              carbs: result.per100g.carbG,
            },
            result.grams,
          );
          const created = repo.addEntryFromRecipe({
            recipeId: recipe.id,
            dateLocal,
            meal,
            grams: result.grams,
            nutritionSnapshot: {
              energyKcal: snap.kcal,
              proteinG: snap.protein,
              fatG: snap.fat,
              carbG: snap.carbs,
            },
          });
          refresh();
          const label = `В дневник: ${recipe.name}`;
          showFlash(label);
          setUndo({ entryIds: [created.id], message: label });
          setConfirmOpen(false);
        }}
      />

      <RecookRecipeSheet
        visible={recookOpen}
        recipe={recipe}
        ingredients={ingredients}
        onClose={() => setRecookOpen(false)}
        onConfirm={(draft) => {
          const batch = repo.cookAgainRecipe(recipe.id, draft, dateLocal);
          refresh();
          showFlash(`Партия: ${batch.name}`);
          setRecookOpen(false);
          router.replace(`/recipes/${batch.id}`);
        }}
      />
      <FlashBar />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingBottom: 56 },
  missing: { flex: 1, padding: space.xl, justifyContent: 'center', gap: space.lg },
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: colors.accentSoft,
  },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: type.hero - 4,
    fontWeight: '800',
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  meta: {
    paddingHorizontal: space.lg,
    marginTop: 4,
    marginBottom: space.md,
  },
  summary: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
  },
  block: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ingName: { fontWeight: '600' },
  ingGrams: { fontWeight: '600' },
  footer: {
    marginTop: space.xl,
    marginHorizontal: space.lg,
    paddingTop: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: space.md,
  },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchMin,
    marginTop: space.sm,
  },
});
