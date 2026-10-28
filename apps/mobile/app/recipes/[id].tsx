import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { portion } from '../../../../src/domain/nutrition';
import {
  nutritionForRecipePortion,
  nutritionPer100gCooked,
} from '../../../../src/domain/recipeNutrition';
import { ConfirmPortionSheet } from '@/src/features/diary/ConfirmPortionSheet';
import { RecookRecipeSheet } from '@/src/features/recipes/RecookRecipeSheet';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, dateLocal, meal, refresh, revision, showFlash } = useData();
  const allowAdd = useAddGuard();
  void revision;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recookOpen, setRecookOpen] = useState(false);

  const recipe = id ? repo.getRecipe(id) : null;
  const ingredients = id ? repo.getRecipeIngredients(id) : [];

  const preview = useMemo(() => {
    if (!recipe) return null;
    try {
      return nutritionPer100gCooked(recipe, ingredients);
    } catch {
      return null;
    }
  }, [recipe, ingredients]);

  if (!recipe) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Рецепт не найден</Text>
        <PrimaryButton label="К списку" onPress={() => router.replace('/recipes')} />
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
        ) : null}

        <Text style={styles.title} accessibilityRole="header">
          {recipe.name}
        </Text>
        <Text style={styles.meta}>Выход {recipe.cookedYieldG} г готового</Text>

        <AppCard padding="md" style={styles.macros}>
          <Macro label="ккал/100г" value={fmt(preview?.kcal ?? null)} />
          <Macro label="Б" value={fmt(preview?.protein ?? null)} />
          <Macro label="Ж" value={fmt(preview?.fat ?? null)} />
          <Macro label="У" value={fmt(preview?.carbs ?? null)} />
        </AppCard>

        {recipe.description ? (
          <AppCard padding="md" style={styles.block}>
            <Text style={styles.blockTitle}>Описание</Text>
            <Text style={styles.blockBody}>{recipe.description}</Text>
          </AppCard>
        ) : null}

        {recipe.instructions ? (
          <AppCard padding="md" style={styles.block}>
            <Text style={styles.blockTitle}>Как готовить</Text>
            <Text style={styles.blockBody}>{recipe.instructions}</Text>
          </AppCard>
        ) : null}

        <AppCard padding="md" style={styles.block}>
          <Text style={styles.blockTitle}>
            Ингредиенты · {ingredients.length}
          </Text>
          {ingredients.length === 0 ? (
            <Text style={styles.blockBody}>
              Структурированных ингредиентов нет — КБЖУ только из ручных значений на 100 г, если
              заданы. Текст описания не считается ингредиентами.
            </Text>
          ) : (
            ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.displayName}</Text>
                  <Text style={styles.ingMeta}>
                    Б {ing.proteinG === null ? '—' : Math.round(ing.proteinG)} · Ж{' '}
                    {ing.fatG === null ? '—' : Math.round(ing.fatG)} · У{' '}
                    {ing.carbG === null ? '—' : Math.round(ing.carbG)}
                    {ing.energyKcal === null ? '' : ` · ${Math.round(ing.energyKcal)} ккал/100г`}
                  </Text>
                </View>
                <Text style={styles.ingGrams}>{ing.rawGrams} г</Text>
              </View>
            ))
          )}
        </AppCard>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>
            Съеденная порция → дневник ({MEAL_LABELS[meal]}). Партия — отдельная заготовка, не лог еды.
          </Text>
          <PrimaryButton label="Добавить съеденную порцию" onPress={() => setConfirmOpen(true)} />

          <PrimaryButton
            variant="secondary"
            label="Приготовить партию"
            onPress={() => setRecookOpen(true)}
          />
          <PrimaryButton
            variant="secondary"
            label="Редактировать"
            onPress={() => router.push(`/recipes/edit/${recipe.id}`)}
          />

          <Pressable
            style={styles.deleteBtn}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Удалить рецепт"
          >
            <Text style={styles.deleteBtnText}>Удалить рецепт</Text>
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
          repo.addEntryFromRecipe({
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
          showFlash(`В дневник: ${recipe.name}`);
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
          showFlash(`Партия создана (рецепт не изменён): ${batch.name}`);
          setRecookOpen(false);
          router.replace(`/recipes/${batch.id}`);
        }}
      />
    </View>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 56 },
  missing: { flex: 1, padding: space.xl, justifyContent: 'center', gap: space.lg },
  missingTitle: { fontSize: type.title, fontWeight: '700', color: colors.text },
  hero: {
    width: '100%',
    height: 180,
    backgroundColor: colors.accentSoft,
  },
  title: {
    fontSize: type.hero - 4,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: space.lg,
    marginTop: space.lg,
  },
  meta: {
    fontSize: type.caption,
    color: colors.textSecondary,
    paddingHorizontal: space.lg,
    marginTop: 4,
    marginBottom: space.md,
  },
  macros: {
    flexDirection: 'row',
    marginHorizontal: space.lg,
    paddingVertical: space.md,
    marginBottom: space.lg,
  },
  macro: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  macroLabel: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  block: {
    marginHorizontal: space.lg,
    marginBottom: space.lg,
  },
  blockTitle: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: space.sm,
  },
  blockBody: { fontSize: type.body, color: colors.text, lineHeight: 22 },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ingName: { fontSize: type.body, color: colors.text, fontWeight: '600' },
  ingMeta: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  ingGrams: { fontSize: type.body, fontWeight: '600', color: colors.textSecondary },
  footer: {
    marginTop: space.xl,
    marginHorizontal: space.lg,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.md,
  },
  footerHint: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.xs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: touchMin,
  },
  editBtnText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchMin,
    marginTop: space.sm,
  },
  deleteBtnText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: type.caption,
  },
});
