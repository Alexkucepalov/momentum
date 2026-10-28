import { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  macrosForStrip,
  nutritionPer100gCooked,
  recipeHasManualPer100g,
} from '../../../../src/domain/recipeNutrition';
import type { Recipe, RecipeIngredient } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { MacroStrip } from '@/src/components/MacroStrip';
import { RecipeHubActions } from '@/src/features/recipes/RecipeHubActions';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, surfaceCard, touchMin, type } from '@/src/theme/tokens';

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

  useLayoutEffect(() => {
    // Single create path lives in RecipeHubActions — no duplicate header +.
    navigation.setOptions({ headerRight: () => null });
  }, [navigation]);

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
              { id: 'all' as const, label: 'Все', count: counts.all, icon: 'apps-outline' as const },
              { id: 'mine' as const, label: 'Свои', count: counts.mine, icon: 'person-outline' as const },
              {
                id: 'archive' as const,
                label: 'Архив',
                count: counts.archive,
                icon: 'library-outline' as const,
              },
            ]
          ).map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${f.label}, ${f.count}`}
              >
                <Ionicons
                  name={f.icon}
                  size={14}
                  color={on ? colors.primaryButtonText : colors.textSecondary}
                />
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f.label} · {f.count}
                </Text>
              </Pressable>
            );
          })}
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
              <Text style={styles.emptyFilterTitle}>Ничего не найдено</Text>
              <Text style={styles.emptyFilterBody}>
                Сбрось фильтр или поиск — либо добавь рецепт кнопками сверху.
              </Text>
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
          return (
            <RecipeCard
              recipe={item}
              ingredients={ings}
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
  ingredients,
  onPress,
}: {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  onPress: () => void;
}) {
  const hasManual = recipeHasManualPer100g(recipe);
  const fromArchive = isArchiveRecipe(recipe);
  const per100 = macrosForStrip(nutritionPer100gCooked(recipe, ingredients));
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Рецепт ${recipe.name}`}
    >
      {recipe.photoUri ? (
        <Image source={{ uri: recipe.photoUri }} style={styles.thumb} />
      ) : null}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={3}>
            {recipe.name}
          </Text>
          {fromArchive ? (
            <View style={styles.badge}>
              <Ionicons name="library-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.badgeText}>архив</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {recipe.cookedYieldG} г · {ingredients.length} ингр.
          {hasManual ? ' · КБЖУ вручную' : ''}
        </Text>
        <MacroStrip {...per100} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: space.lg, paddingTop: space.md },
  hubCard: {
    marginBottom: space.md,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: space.md,
  },
  searchInput: { flex: 1, fontSize: type.body, color: colors.text },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
  },
  chipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  list: { paddingHorizontal: space.lg, paddingBottom: 48, paddingTop: space.xs },
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
    fontSize: type.subtitle,
    color: colors.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  emptyFilterBody: {
    fontSize: type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    ...surfaceCard,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.xs,
    minHeight: touchMin,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
  },
  cardBody: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  cardTitle: { flex: 1, fontSize: type.body, fontWeight: '700', color: colors.text, lineHeight: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  cardMeta: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 16 },
  pressed: { opacity: 0.85 },
});
