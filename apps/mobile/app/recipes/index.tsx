import { RecipeImage } from '@/src/features/recipes/RecipeImage';
import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  formatPantryCoverageBadge,
  recipePantryCoverage,
} from '../../../../src/domain/recipePantryCoverage';
import { recipeHasManualPer100g } from '../../../../src/domain/recipeNutrition';
import type { Recipe } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { RecipeHubActions } from '@/src/features/recipes/RecipeHubActions';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { AppText, Chip, colors, radius, space, touchMin } from '@/src/design-system';

type Filter = 'all' | 'mine' | 'archive';

function isArchiveRecipe(r: Recipe): boolean {
  return r.id.startsWith('import:');
}

export default function RecipesIndexScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { repo } = useData();
  const revision = useAnyRevision();
  void revision;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const recipes = repo.listRecipes();
  const pantry = repo.listPantryItems();
  const pantryNonEmpty = pantry.length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/recipes/new')}
          accessibilityRole="button"
          accessibilityLabel="Новый рецепт вручную"
          style={styles.headerBtn}
        >
          <Ionicons name="add" size={26} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const counts = useMemo(() => {
    let archive = 0;
    let mine = 0;
    for (const r of recipes) {
      if (isArchiveRecipe(r)) archive += 1;
      else mine += 1;
    }
    return { all: recipes.length, mine, archive };
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (filter === 'archive' && !isArchiveRecipe(r)) return false;
      if (filter === 'mine' && isArchiveRecipe(r)) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [recipes, query, filter]);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <RecipeHubActions />

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Найти рецепт"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Поиск рецепта"
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Очистить поиск"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters} accessibilityRole="toolbar">
          {(
            [
              { id: 'all' as const, label: 'Все', count: counts.all },
              { id: 'mine' as const, label: 'Свои', count: counts.mine },
              { id: 'archive' as const, label: 'Архив', count: counts.archive },
            ]
          ).map((f) => (
            <Chip
              key={f.id}
              label={`${f.label} ${f.count}`}
              selected={filter === f.id}
              onPress={() => setFilter(f.id)}
              accessibilityLabel={`${f.label}, ${f.count}`}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          query.trim() || filter !== 'all' ? (
            <View style={styles.emptyFilter}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={28} color={colors.textMuted} />
              </View>
              <AppText variant="subtitle" style={styles.emptyFilterTitle}>
                Ничего не найдено
              </AppText>
              <AppText variant="body" tone="secondary" style={styles.emptyFilterBody}>
                Сбрось фильтр или поиск — либо добавь рецепт кнопками сверху.
              </AppText>
            </View>
          ) : (
            <EmptyState
              compact
              icon="restaurant-outline"
              title="Пока нет рецептов"
              body="Вручную, из текста чата или из личного архива — потом порция в дневник за секунды."
              actionLabel="Создать вручную"
              onAction={() => router.push('/recipes/new')}
              secondaryActionLabel="Вставить из текста"
              onSecondaryAction={() => router.push('/recipes/import-text')}
            />
          )
        }
        renderItem={({ item }) => {
          const ings = repo.getRecipeIngredients(item.id);
          const coverage = pantryNonEmpty ? recipePantryCoverage(ings, pantry) : null;
          return (
            <RecipeCard
              recipe={item}
              ingredientCount={ings.length}
              pantryBadge={coverage ? formatPantryCoverageBadge(coverage) : null}
              onPress={() => router.push(`/recipes/${item.id}`)}
            />
          );
        }}
      />
    </View>
  );
}

function RecipeCard({
  recipe,
  ingredientCount,
  pantryBadge,
  onPress,
}: {
  recipe: Recipe;
  ingredientCount: number;
  pantryBadge: string | null;
  onPress: () => void;
}) {
  const hasManual = recipeHasManualPer100g(recipe);
  const fromArchive = isArchiveRecipe(recipe);
  const meta = [
    `${recipe.cookedYieldG} г`,
    `${ingredientCount} ингр.`,
    pantryBadge,
    fromArchive ? 'архив' : null,
    hasManual ? 'КБЖУ вручную' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Рецепт ${recipe.name}${pantryBadge ? `, ${pantryBadge}` : ''}`}
      testID={`recipe-card-${recipe.id}`}
    >
      {recipe.photoUri ? (
        <RecipeImage uri={recipe.photoUri} style={styles.thumb} compact />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons
            name={fromArchive ? 'library-outline' : 'restaurant-outline'}
            size={18}
            color={colors.textMuted}
          />
        </View>
      )}
      <View style={styles.cardBody}>
        <AppText variant="body" style={styles.cardTitle} numberOfLines={1}>
          {recipe.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  top: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    minHeight: touchMin,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  list: {
    paddingHorizontal: space.lg,
    paddingBottom: 48,
    paddingTop: space.md,
    gap: 0,
  },
  emptyFilter: {
    padding: space.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  emptyFilterTitle: {
    fontWeight: '700',
    marginBottom: space.sm,
    textAlign: 'center',
  },
  emptyFilterBody: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchMin + 8,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2, minWidth: 0 },
  cardTitle: { fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
