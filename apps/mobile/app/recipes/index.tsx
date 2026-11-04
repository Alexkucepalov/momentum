import { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  formatPantryCoverageBadge,
  recipePantryCoverage,
} from '../../../../src/domain/recipePantryCoverage';
import { recipeHasManualPer100g } from '../../../../src/domain/recipeNutrition';
import type { Recipe } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { MacroStrip } from '@/src/components/MacroStrip';
import { RecipeHubActions } from '@/src/features/recipes/RecipeHubActions';
import { useData } from '@/src/state/DataContext';
import { AppCard, AppText, Chip, colors, radius, space, touchMin } from '@/src/design-system';

type Filter = 'all' | 'mine' | 'archive';

function isArchiveRecipe(r: Recipe): boolean {
  return r.id.startsWith('import:');
}

export default function RecipesIndexScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { repo, revision } = useData();
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
        <AppText variant="caption" tone="muted" style={styles.canonHint}>
          Канон рецептов — этот список. Из дневника «Добавить еду → Рецепты» — быстрый лог порции.
        </AppText>
        <View style={styles.hubCard}>
          <RecipeHubActions />
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Найти по названию"
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

        <View style={styles.filters} accessibilityRole="tablist">
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
  return (
    <Pressable
      style={({ pressed }) => [pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Рецепт ${recipe.name}${pantryBadge ? `, ${pantryBadge}` : ''}`}
      testID={`recipe-card-${recipe.id}`}
    >
      <AppCard style={styles.card}>
        {recipe.photoUri ? (
          <Image source={{ uri: recipe.photoUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, fromArchive && styles.thumbArchive]}>
            <Ionicons
              name={fromArchive ? 'library-outline' : 'restaurant-outline'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <AppText variant="body" style={styles.cardTitle} numberOfLines={2}>
              {recipe.name}
            </AppText>
            {pantryBadge ? (
              <View style={styles.badge}>
                <Ionicons name="cube-outline" size={11} color={colors.textSecondary} />
                <AppText variant="label" tone="secondary">
                  {pantryBadge}
                </AppText>
              </View>
            ) : fromArchive ? (
              <View style={styles.badge}>
                <Ionicons name="library-outline" size={11} color={colors.textSecondary} />
                <AppText variant="label" tone="secondary">
                  архив
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {recipe.cookedYieldG} г готового · {ingredientCount} ингр.
            {hasManual ? ' · КБЖУ вручную' : ''}
          </AppText>
          <MacroStrip
            energyKcal={recipe.energyKcalPer100g}
            proteinG={recipe.proteinGPer100g}
            fatG={recipe.fatGPer100g}
            carbG={recipe.carbGPer100g}
          />
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  top: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.md },
  canonHint: { marginBottom: -space.xs },
  hubCard: {
    marginBottom: 0,
  },
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  list: { paddingHorizontal: space.lg, paddingBottom: 48, paddingTop: space.xs, gap: space.sm },
  emptyFilter: {
    padding: space.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  emptyFilterTitle: {
    fontWeight: '800',
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
    gap: space.sm,
    padding: space.md,
    minHeight: touchMin,
    marginBottom: space.sm,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbArchive: { backgroundColor: colors.accentSoft },
  cardBody: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  cardTitle: { flex: 1, fontWeight: '700', lineHeight: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chevron: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
