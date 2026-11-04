import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { nutritionForRecipePortion } from '../../../../../src/domain/recipeNutrition';
import type { Recipe, RecipeIngredient } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { SwipeToDismissSheet } from '../../components/SwipeToDismissSheet';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { AppButton } from '@/src/design-system';

function fmt(n: number | null): string {
  if (n === null) return '—';
  return String(Math.round(n));
}

/**
 * «Приготовить снова»: проверить граммы ингредиентов, указать фактический выход,
 * создать отдельную партию рецепта с корректным КБЖУ на 100 г.
 */
export function RecookRecipeSheet({
  visible,
  recipe,
  ingredients,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  recipe: Recipe | null;
  ingredients: RecipeIngredient[];
  onClose: () => void;
  onConfirm: (draft: {
    cookedYieldG: number;
    ingredientRawGrams: Record<string, number>;
  }) => void;
}) {
  const [yieldRaw, setYieldRaw] = useState('');
  const [gramsById, setGramsById] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !recipe) return;
    setYieldRaw(String(recipe.cookedYieldG));
    const next: Record<string, string> = {};
    for (const ing of ingredients) next[ing.id] = String(ing.rawGrams);
    setGramsById(next);
    setError(null);
  }, [visible, recipe, ingredients]);

  const preview = useMemo(() => {
    if (!recipe) return null;
    const yieldG = Number(String(yieldRaw).replace(',', '.'));
    if (!Number.isFinite(yieldG) || yieldG <= 0) return null;
    const draftIngs = ingredients.map((ing) => {
      const raw = Number(String(gramsById[ing.id] ?? ing.rawGrams).replace(',', '.'));
      return {
        ...ing,
        rawGrams: Number.isFinite(raw) && raw >= 0 ? raw : ing.rawGrams,
      };
    });
    try {
      // With ingredients — recompute from snapshots + new yield (ignore old manual).
      // Without — keep manual per-100g from source recipe.
      const draftRecipe =
        draftIngs.length > 0
          ? {
              ...recipe,
              cookedYieldG: yieldG,
              energyKcalPer100g: null,
              proteinGPer100g: null,
              fatGPer100g: null,
              carbGPer100g: null,
            }
          : { ...recipe, cookedYieldG: yieldG };
      return nutritionForRecipePortion(draftRecipe, draftIngs, 100);
    } catch {
      return null;
    }
  }, [recipe, ingredients, yieldRaw, gramsById]);

  const submit = () => {
    if (!recipe) return;
    try {
      setError(null);
      const cookedYieldG = Number(String(yieldRaw).replace(',', '.'));
      if (!Number.isFinite(cookedYieldG) || cookedYieldG <= 0) {
        throw new Error('Выход готового блюда должен быть > 0');
      }
      const ingredientRawGrams: Record<string, number> = {};
      for (const ing of ingredients) {
        const raw = Number(String(gramsById[ing.id] ?? '').replace(',', '.'));
        if (!Number.isFinite(raw) || raw < 0) {
          throw new Error(`Граммы «${ing.displayName}» — число ≥ 0`);
        }
        ingredientRawGrams[ing.id] = raw;
      }
      onConfirm({ cookedYieldG, ingredientRawGrams });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <SwipeToDismissSheet visible={visible && recipe != null} onClose={onClose} maxHeightRatio={0.92}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Приготовить снова
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Text style={styles.close}>Закрыть</Text>
          </Pressable>
        </View>

        <Text style={styles.lead}>
          Укажи фактические граммы ингредиентов и вес готового блюда. Создастся отдельная партия —
          исходный рецепт не изменится. Потом добавляй в дневник по 250–350 г.
        </Text>

        {ingredients.length > 0 ? (
          <>
            <Text style={styles.section}>Ингредиенты</Text>
            {ingredients.map((ing) => (
              <View key={ing.id} style={styles.ingRow}>
                <Text style={styles.ingName} numberOfLines={2}>
                  {ing.displayName}
                </Text>
                <TextInput
                  value={gramsById[ing.id] ?? ''}
                  onChangeText={(t) => setGramsById((prev) => ({ ...prev, [ing.id]: t }))}
                  keyboardType="decimal-pad"
                  style={styles.ingInput}
                  accessibilityLabel={`Граммы ${ing.displayName}`}
                />
                <Text style={styles.ingUnit}>г</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.hint}>
            У рецепта нет структуры ингредиентов — партия унаследует КБЖУ на 100 г, если они заданы.
          </Text>
        )}

        <Text style={styles.section}>Выход готового</Text>
        <View style={styles.yieldRow}>
          <TextInput
            value={yieldRaw}
            onChangeText={setYieldRaw}
            keyboardType="decimal-pad"
            style={styles.yieldInput}
            accessibilityLabel="Выход готового блюда в граммах"
          />
          <Text style={styles.ingUnit}>г</Text>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>На 100 г партии</Text>
          <Text style={styles.previewValue}>
            {fmt(preview?.kcal ?? null)} ккал · Б {fmt(preview?.protein ?? null)} · Ж{' '}
            {fmt(preview?.fat ?? null)} · У {fmt(preview?.carbs ?? null)}
          </Text>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        ) : null}

        <AppButton label="Создать партию" onPress={submit} />
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text, flex: 1 },
  close: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
    minHeight: touchMin,
    textAlignVertical: 'center',
  },
  lead: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.lg,
  },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: space.sm,
  },
  hint: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.lg,
    lineHeight: 18,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  ingName: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  ingInput: {
    width: 72,
    minHeight: touchMin - 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: type.body,
    fontWeight: '700',
    color: colors.text,
  },
  ingUnit: { fontSize: type.caption, color: colors.textMuted, fontWeight: '600', width: 16 },
  yieldRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  yieldInput: {
    flex: 1,
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
  },
  preview: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.lg,
  },
  previewLabel: { fontSize: type.micro, color: colors.textMuted, fontWeight: '700' },
  previewValue: { fontSize: type.body, fontWeight: '700', color: colors.text, marginTop: 4 },
  error: { color: colors.danger, marginBottom: space.sm, fontSize: type.caption },
});
