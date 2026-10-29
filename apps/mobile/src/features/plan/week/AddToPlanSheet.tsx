import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  defaultProductPortionGrams,
  defaultRecipePortionGrams,
} from '../../../../../../src/domain/defaultPortionGrams';
import { portion } from '../../../../../../src/domain/nutrition';
import { nutritionForRecipePortion } from '../../../../../../src/domain/recipeNutrition';
import type {
  FoodEntry,
  FoodProduct,
  MealSlot,
  Recipe,
  RecipeIngredient,
} from '../../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { SegmentedControl } from '@/src/ui/SegmentedControl';

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

type CatalogTab = 'recent' | 'recipes' | 'products';

type PickRow = {
  key: string;
  name: string;
  grams: number;
  kcal: number | null;
  recipeId: string | null;
  productId: string | null;
};

function kcalText(kcal: number | null): string {
  return kcal == null ? '— ккал' : `${Math.round(kcal)} ккал`;
}

export function AddToPlanSheet({
  visible,
  slot,
  products,
  recipes,
  recent,
  lastGramsForProduct,
  lastGramsForRecipe,
  getRecipeIngredients,
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
  getRecipeIngredients: (id: string) => RecipeIngredient[];
  onClose: () => void;
  onAdd: (input: {
    displayName: string;
    grams: number;
    recipeId?: string | null;
    productId?: string | null;
  }) => void;
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<CatalogTab>('recipes');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (name: string) => !q || name.toLowerCase().includes(q);

    if (tab === 'recent') {
      const seen = new Set<string>();
      const out: PickRow[] = [];
      for (const entry of recent) {
        const key = `${entry.displayName}|${entry.recipeId ?? ''}|${entry.productId ?? ''}`;
        if (seen.has(key) || !match(entry.displayName)) continue;
        seen.add(key);
        out.push({
          key: `e-${entry.id}`,
          name: entry.displayName,
          grams: entry.grams,
          kcal: entry.energyKcal,
          recipeId: entry.recipeId,
          productId: entry.productId,
        });
        if (out.length >= 24) break;
      }
      return out;
    }

    if (tab === 'recipes') {
      return recipes
        .filter((recipe) => match(recipe.name))
        .slice(0, 24)
        .map((recipe) => {
          const grams = defaultRecipePortionGrams(
            lastGramsForRecipe(recipe.id),
            recipe.cookedYieldG,
          );
          let kcal: number | null = null;
          try {
            kcal = nutritionForRecipePortion(
              recipe,
              getRecipeIngredients(recipe.id),
              grams,
            ).kcal;
          } catch {
            kcal = null;
          }
          return {
            key: `r-${recipe.id}`,
            name: recipe.name,
            grams,
            kcal,
            recipeId: recipe.id,
            productId: null,
          };
        });
    }

    return products
      .filter((product) => match(product.name))
      .slice(0, 24)
      .map((product) => {
        const grams = defaultProductPortionGrams(lastGramsForProduct(product.id));
        const nutrition = portion(
          {
            kcal: product.energyKcal,
            protein: product.proteinG,
            fat: product.fatG,
            carbs: product.carbG,
          },
          grams,
        );
        return {
          key: `p-${product.id}`,
          name: product.name,
          grams,
          kcal: nutrition.kcal,
          recipeId: null,
          productId: product.id,
        };
      });
  }, [
    tab,
    query,
    recent,
    recipes,
    products,
    lastGramsForProduct,
    lastGramsForRecipe,
    getRecipeIngredients,
  ]);

  const reset = () => {
    setQuery('');
    setTab('recipes');
  };

  const close = () => {
    reset();
    onClose();
  };

  const add = (row: PickRow) => {
    if (!Number.isFinite(row.grams) || row.grams <= 0) return;
    onAdd({
      displayName: row.name,
      grams: row.grams,
      recipeId: row.recipeId,
      productId: row.productId,
    });
    reset();
  };

  if (!slot) return null;

  return (
    <SwipeToDismissSheet visible={visible} onClose={close} maxHeightRatio={0.92}>
      <FormScrollView variant="sheet" contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>{MEAL_LABELS[slot]}</Text>
            <Text style={styles.title} accessibilityRole="header">
              Добавить блюдо
            </Text>
          </View>
          <Pressable
            onPress={close}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск рецептов и продуктов"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Поиск для плана"
            returnKeyType="search"
            autoFocus
          />
        </View>

        <SegmentedControl
          dense
          value={tab}
          options={[
            { id: 'recent', label: 'Недавние' },
            { id: 'recipes', label: 'Рецепты' },
            { id: 'products', label: 'Продукты' },
          ]}
          onChange={setTab}
        />

        {rows.length === 0 ? (
          <Text style={styles.empty}>
            {query.trim() ? 'Ничего не найдено' : 'В этом разделе пока пусто'}
          </Text>
        ) : (
          rows.map((row) => (
            <View key={row.key} style={styles.row}>
              <View style={styles.mark}>
                <Text style={styles.markText}>{row.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={2}>
                  {row.name}
                </Text>
                <Text style={styles.meta}>
                  {Math.round(row.grams)} г · {kcalText(row.kcal)}
                </Text>
              </View>
              <Pressable
                onPress={() => add(row)}
                style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Добавить ${row.name}`}
              >
                <Text style={styles.plusText}>+</Text>
              </Pressable>
            </View>
          ))
        )}
      </FormScrollView>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  headerText: { flex: 1, gap: 2 },
  kicker: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  close: {
    width: touchMin,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.text },
  empty: { color: colors.textMuted, fontSize: type.body, paddingVertical: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { fontSize: 22, fontWeight: '500', color: colors.text, marginTop: -2 },
  pressed: { opacity: 0.7 },
});
