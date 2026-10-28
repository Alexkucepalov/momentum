import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  defaultProductPortionGrams,
  defaultRecipePortionGrams,
} from '../../../../../../src/domain/defaultPortionGrams';
import { unifiedFoodSearch } from '../../../../../../src/domain/unifiedFoodSearch';
import type { FoodEntry, FoodProduct, MealSlot, Recipe } from '../../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, elevation, radius, space, touchMin, type } from '@/src/theme/tokens';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export function AddToPlanSheet({
  visible,
  slot,
  dateLocal,
  products,
  recipes,
  recent,
  lastGramsForProduct,
  lastGramsForRecipe,
  onClose,
  onAdd,
}: {
  visible: boolean;
  slot: MealSlot | null;
  dateLocal: string;
  products: FoodProduct[];
  recipes: Recipe[];
  recent: FoodEntry[];
  lastGramsForProduct: (id: string) => number | null;
  lastGramsForRecipe: (id: string) => number | null;
  onClose: () => void;
  onAdd: (input: {
    displayName: string;
    grams: number;
    recipeId?: string | null;
    productId?: string | null;
  }) => void;
}) {
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('150');
  const [picked, setPicked] = useState<{
    displayName: string;
    recipeId: string | null;
    productId: string | null;
  } | null>(null);

  const hits = useMemo(
    () =>
      query.trim()
        ? unifiedFoodSearch({ query, products, recipes, recent }).slice(0, 24)
        : [],
    [query, products, recipes, recent],
  );

  const reset = () => {
    setQuery('');
    setGrams('150');
    setPicked(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  if (!slot) return null;

  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={close}
      maxHeightRatio={0.88}
    >
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          В план · {MEAL_LABELS[slot]}
        </Text>
        <Text style={styles.sub}>Не попадёт в дневник, пока не нажмёшь «В дневник».</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Рецепт или продукт"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Поиск для плана"
            returnKeyType="search"
            autoFocus
          />
        </View>

        {picked ? (
          <View style={styles.picked}>
            <Text style={styles.pickedName}>{picked.displayName}</Text>
            <Text style={styles.label}>Порция, г</Text>
            <TextInput
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Порция в граммах"
            />
            <PrimaryButton
              label="Добавить в план"
              onPress={() => {
                const g = Number(grams.replace(',', '.'));
                if (!Number.isFinite(g) || g <= 0) return;
                onAdd({
                  displayName: picked.displayName,
                  grams: g,
                  recipeId: picked.recipeId,
                  productId: picked.productId,
                });
                reset();
              }}
            />
            <Pressable onPress={() => setPicked(null)} style={styles.cancel}>
              <Text style={styles.cancelText}>Выбрать другое</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {query.trim() && hits.length === 0 ? (
              <Text style={styles.empty}>Ничего не найдено</Text>
            ) : null}
            {hits.map((hit) => {
              if (hit.kind === 'recipe') {
                const r = hit.recipe;
                return (
                  <Pressable
                    key={`r-${r.id}`}
                    style={styles.row}
                    onPress={() => {
                      setPicked({
                        displayName: r.name,
                        recipeId: r.id,
                        productId: null,
                      });
                      setGrams(
                        String(
                          defaultRecipePortionGrams(lastGramsForRecipe(r.id), r.cookedYieldG),
                        ),
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Рецепт ${r.name}`}
                  >
                    <Ionicons name="restaurant-outline" size={18} color={colors.fat} />
                    <Text style={styles.rowText} numberOfLines={2}>
                      {r.name}
                    </Text>
                  </Pressable>
                );
              }
              if (hit.kind === 'product') {
                const p = hit.product;
                return (
                  <Pressable
                    key={`p-${p.id}`}
                    style={styles.row}
                    onPress={() => {
                      setPicked({
                        displayName: p.name,
                        recipeId: null,
                        productId: p.id,
                      });
                      setGrams(
                        String(defaultProductPortionGrams(lastGramsForProduct(p.id))),
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Продукт ${p.name}`}
                  >
                    <Ionicons name="nutrition-outline" size={18} color={colors.protein} />
                    <Text style={styles.rowText} numberOfLines={2}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              }
              const e = hit.entry;
              return (
                <Pressable
                  key={`e-${e.id}`}
                  style={styles.row}
                  onPress={() => {
                    setPicked({
                      displayName: e.displayName,
                      recipeId: e.recipeId,
                      productId: e.productId,
                    });
                    setGrams(String(e.grams));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Недавнее ${e.displayName}`}
                >
                  <Ionicons name="time-outline" size={18} color={colors.carbs} />
                  <Text style={styles.rowText} numberOfLines={2}>
                    {e.displayName}
                  </Text>
                </Pressable>
              );
            })}
            {!query.trim() ? (
              <Text style={styles.hint}>Начни ввод — поиск по рецептам и продуктам.</Text>
            ) : null}
          </View>
        )}

        <Pressable onPress={close} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.md },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  sub: { fontSize: type.caption, color: colors.textSecondary, marginTop: -space.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
    paddingHorizontal: space.md,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.text },
  list: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...elevation.card,
  },
  rowText: { flex: 1, fontWeight: '700', color: colors.text, fontSize: type.body },
  empty: { color: colors.textMuted, fontSize: type.body },
  hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
  picked: { gap: space.sm },
  pickedName: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  label: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
  },
  cancel: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
});
