import { entryAmountLabel } from '../../../../../src/domain/diaryEntry';
import { useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { sortProductsByFrequency } from '../../../../../src/domain/productFrequency';
import type { FoodEntry, FoodProduct, Recipe } from '../../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { MacroStrip } from '@/src/components/MacroStrip';
import { AppText, Chip, colors, radius, space, touchMin, type } from '@/src/design-system';

const SOURCE_RU: Record<string, string> = {
  user: 'свой',
  catalog: 'каталог',
  label: 'этикетка',
  recipe: 'рецепт',
  missing: 'нет данных',
};

/** Virtualize product/recipe rows once the combined list exceeds this. */
export const CATALOG_VIRTUALIZE_THRESHOLD = 24;

export type CatalogFilter = 'all' | 'favorites' | 'frequent' | 'recent' | 'recipes';

type CatalogRow =
  | { key: string; kind: 'section'; title: string }
  | { key: string; kind: 'product'; product: FoodProduct }
  | { key: string; kind: 'recipe'; recipe: Recipe; ingCount: number }
  | { key: string; kind: 'empty'; title: string; body: string; actionLabel?: string; onAction?: () => void };

export function FoodCatalogList({
  filter,
  onFilterChange,
  products,
  recipes,
  recent,
  frequent,
  query,
  recipeIngredientCounts,
  onAddProduct,
  onAddRecipe,
  onOpenRecipe,
  onBrowseRecipes,
  onCreateManual,
  onToggleFavorite,
  onRepeatEntry,
}: {
  filter: CatalogFilter;
  onFilterChange: (f: CatalogFilter) => void;
  products: FoodProduct[];
  recipes: Recipe[];
  recent: FoodEntry[];
  frequent: FoodProduct[];
  query: string;
  recipeIngredientCounts?: Record<string, number>;
  onAddProduct: (p: FoodProduct) => void;
  onAddRecipe: (r: Recipe) => void;
  onOpenRecipe?: (r: Recipe) => void;
  onBrowseRecipes?: () => void;
  /** Empty catalog / search → create product manually. */
  onCreateManual?: () => void;
  onToggleFavorite: (p: FoodProduct) => void;
  onRepeatEntry: (e: FoodEntry) => void;
}) {
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const qDigits = query.replace(/\D/g, '');
  const freqScore = new Map(frequent.map((p, i) => [p.id, frequent.length - i]));

  const productMatches = (p: FoodProduct): boolean => {
    if (!searching) return true;
    const nameHit = p.name.toLowerCase().includes(q);
    const brandHit = (p.brand ?? '').toLowerCase().includes(q);
    const codeHit = qDigits.length >= 4 && (p.barcode?.includes(qDigits) ?? false);
    return nameHit || brandHit || codeHit;
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (!searching) {
        if (filter === 'favorites' && !p.isFavorite) return false;
        if (filter === 'frequent') return freqScore.has(p.id);
        if (filter === 'recent' || filter === 'recipes') return false;
      } else if (filter === 'favorites' && !p.isFavorite) {
        return false;
      } else if (filter === 'frequent' && !freqScore.has(p.id)) {
        return false;
      }
      return productMatches(p);
    });
    if (searching || filter === 'all' || filter === 'frequent') {
      list = sortProductsByFrequency(list, freqScore);
    }
    return list;
  }, [products, filter, searching, q, qDigits, frequent]);

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((r) => {
        if (!searching) {
          if (filter !== 'recipes' && filter !== 'all') return false;
          return true;
        }
        if (filter === 'favorites' || filter === 'recent' || filter === 'frequent') return false;
        return r.name.toLowerCase().includes(q);
      }),
    [recipes, searching, filter, q],
  );

  const recentUnique = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodEntry[] = [];
    for (const e of recent) {
      const key = `${e.displayName}|${e.grams}|${e.productId ?? e.recipeId}`;
      if (seen.has(key)) continue;
      if (searching && !e.displayName.toLowerCase().includes(q)) continue;
      seen.add(key);
      out.push(e);
      if (out.length >= 10) break;
    }
    return out;
  }, [recent, searching, q]);

  const favoriteCount = products.filter((p) => p.isFavorite).length;
  const showRecent = filter === 'recent' || (filter === 'all' && !searching);
  const showFrequentStrip = filter === 'all' && !searching && frequent.length > 0;
  const showProducts =
    searching || filter === 'all' || filter === 'favorites' || filter === 'frequent';
  const showRecipes =
    searching || filter === 'recipes' || (filter === 'all' && recipes.length > 0);

  const filters: Array<{ id: CatalogFilter; label: string; count: number }> = [
    { id: 'all', label: 'Все', count: products.length + recipes.length },
    { id: 'frequent', label: 'Частые', count: frequent.length },
    { id: 'favorites', label: 'Избранное', count: favoriteCount },
    { id: 'recent', label: 'Недавние', count: recentUnique.length },
    { id: 'recipes', label: 'Рецепты', count: recipes.length },
  ];

  const rows: CatalogRow[] = useMemo(() => {
    const out: CatalogRow[] = [];

    if (searching && filteredProducts.length === 0 && filteredRecipes.length === 0) {
      out.push({
        key: 'empty-search',
        kind: 'empty',
        title: 'Ничего не найдено',
        body: 'Попробуй другое слово или создай продукт вручную.',
        actionLabel: onCreateManual ? 'Создать вручную' : undefined,
        onAction: onCreateManual,
      });
      return out;
    }

    if (showRecipes && filteredRecipes.length > 0) {
      if (filter === 'all') out.push({ key: 'sec-recipes', kind: 'section', title: 'Рецепты' });
      for (const r of filteredRecipes) {
        out.push({
          key: `recipe-${r.id}`,
          kind: 'recipe',
          recipe: r,
          ingCount: recipeIngredientCounts?.[r.id] ?? 0,
        });
      }
    }

    if (showProducts) {
      if (filteredProducts.length === 0 && !searching) {
        const empty =
          filter === 'favorites'
            ? {
                title: 'Нет избранного',
                body: 'Нажми ★ у продукта, чтобы добавить в избранное.',
              }
            : filter === 'frequent'
              ? {
                  title: 'Пока нет частых',
                  body: 'Частые появятся после нескольких записей в дневник.',
                }
              : {
                  title: 'Каталог пуст',
                  body: 'Создай продукт вручную, через сканер или добавь рецепт.',
                  actionLabel: onCreateManual ? 'Создать продукт' : undefined,
                  onAction: onCreateManual,
                };
        out.push({ key: 'empty-products', kind: 'empty', ...empty });
      } else if (filteredProducts.length > 0) {
        if (filter === 'all') out.push({ key: 'sec-products', kind: 'section', title: 'Продукты' });
        for (const p of filteredProducts) {
          out.push({ key: `product-${p.id}`, kind: 'product', product: p });
        }
      }
    }

    if (filter === 'recent' && recentUnique.length === 0) {
      out.push({
        key: 'empty-recent',
        kind: 'empty',
        title: 'Нет недавних',
        body: 'Записи появятся после добавления еды в дневник.',
        actionLabel: onCreateManual ? 'Добавить еду' : undefined,
        onAction: onCreateManual,
      });
    }

    if (filter === 'recipes' && filteredRecipes.length === 0) {
      out.push({
        key: 'empty-recipes',
        kind: 'empty',
        title: 'Рецептов пока нет',
        body: 'Открой раздел рецептов, чтобы создать блюдо.',
        actionLabel: onBrowseRecipes ? 'Открыть рецепты' : undefined,
        onAction: onBrowseRecipes,
      });
    }

    return out;
  }, [
    searching,
    filteredProducts,
    filteredRecipes,
    showRecipes,
    showProducts,
    filter,
    recipeIngredientCounts,
    recentUnique.length,
    onBrowseRecipes,
    onCreateManual,
  ]);

  const header = (
    <View>
      <View style={styles.sectionHead}>
        <View style={styles.sectionText}>
          <AppText variant="subtitle" style={styles.section}>
            {searching ? 'Результаты' : 'Каталог'}
          </AppText>
          {!searching ? (
            <AppText variant="caption" tone="muted">
              Свои продукты, справочник и рецепты
            </AppText>
          ) : null}
        </View>
        {!searching && onBrowseRecipes ? (
          <Pressable
            onPress={onBrowseRecipes}
            accessibilityRole="button"
            accessibilityLabel="Открыть все рецепты"
            hitSlop={8}
            style={styles.linkBtn}
          >
            <AppText variant="caption" style={styles.link}>
              Рецепты
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>

      {!searching ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          accessibilityRole="tablist"
          accessibilityLabel="Фильтры каталога продуктов"
        >
          {filters.map(({ id, label, count }) => (
            <Chip
              key={id}
              label={`${label} ${count}`}
              selected={filter === id}
              onPress={() => onFilterChange(id)}
              accessibilityLabel={`Фильтр ${label}: ${count}`}
            />
          ))}
        </ScrollView>
      ) : null}

      {showRecent && recentUnique.length > 0 ? (
        <View style={styles.block}>
          {filter === 'all' ? (
            <AppText variant="label" tone="muted" style={styles.sub}>
              Быстрый повтор
            </AppText>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentStrip}
          >
            {recentUnique.map((e) => (
              <Pressable
                key={`recent-${e.id}`}
                style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
                onPress={() => onRepeatEntry(e)}
                accessibilityRole="button"
                accessibilityLabel={`Повторить ${e.displayName}, ${entryAmountLabel(e)}`}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="refresh" size={16} color={colors.ink} />
                </View>
                <AppText variant="caption" style={styles.recentName} numberOfLines={2}>
                  {e.displayName}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {entryAmountLabel(e)} · {e.energyKcal === null ? '—' : `${Math.round(e.energyKcal)} ккал`}
                </AppText>
                <AppText variant="caption" tone="accent">
                  + в дневник
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showFrequentStrip ? (
        <View style={styles.block}>
          <AppText variant="label" tone="muted" style={styles.sub}>
            Частые продукты
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentStrip}
          >
            {frequent.slice(0, 12).map((p) => (
              <Pressable
                key={`freq-${p.id}`}
                style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
                onPress={() => onAddProduct(p)}
                accessibilityRole="button"
                accessibilityLabel={`Добавить частый продукт ${p.name}`}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="flash-outline" size={16} color={colors.ink} />
                </View>
                <AppText variant="caption" style={styles.recentName} numberOfLines={2}>
                  {p.name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {p.energyKcal === null ? '— ккал/100г' : `${Math.round(p.energyKcal)} ккал/100г`}
                </AppText>
                <AppText variant="caption" tone="accent">
                  + порция
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const renderItem: ListRenderItem<CatalogRow> = ({ item }) => {
    if (item.kind === 'section') {
      return (
        <AppText variant="label" tone="muted" style={styles.sub}>
          {item.title}
        </AppText>
      );
    }
    if (item.kind === 'empty') {
      return (
        <EmptyState
          compact
          icon="search-outline"
          title={item.title}
          body={item.body}
          actionLabel={item.actionLabel}
          onAction={item.onAction}
        />
      );
    }
    if (item.kind === 'recipe') {
      const { recipe: r, ingCount } = item;
      return (
        <View style={styles.card}>
          <Pressable
            style={styles.cardMain}
            onPress={() => (onOpenRecipe ? onOpenRecipe(r) : onAddRecipe(r))}
            accessibilityRole="button"
            accessibilityLabel={`Открыть рецепт ${r.name}`}
          >
            {r.photoUri ? (
              <Image
                source={{ uri: r.photoUri }}
                style={styles.thumb}
                accessibilityLabel={`Фото ${r.name}`}
              />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Ionicons name="restaurant-outline" size={22} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.cardBody}>
              <AppText variant="body" style={styles.name} numberOfLines={2}>
                {r.name}
              </AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                Выход {r.cookedYieldG} г
                {ingCount > 0 ? ` · ${ingCount} ингр.` : ''}
              </AppText>
              <MacroStrip
                energyKcal={r.energyKcalPer100g}
                proteinG={r.proteinGPer100g}
                fatG={r.fatGPer100g}
                carbG={r.carbGPer100g}
              />
            </View>
          </Pressable>
          <Pressable
            onPress={() => onAddRecipe(r)}
            accessibilityRole="button"
            accessibilityLabel={`Добавить порцию ${r.name}`}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color={colors.primaryButtonText} />
          </Pressable>
        </View>
      );
    }

    const p = item.product;
    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardMain}
          onPress={() => onAddProduct(p)}
          accessibilityRole="button"
          accessibilityLabel={`Добавить продукт ${p.name}, ${
            p.energyKcal === null
              ? 'калорийность неизвестна'
              : `${Math.round(p.energyKcal)} калорий на 100 грамм`
          }`}
        >
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="nutrition-outline" size={22} color={colors.textMuted} />
          </View>
          <View style={styles.cardBody}>
            <AppText variant="body" style={styles.nameFlex} numberOfLines={2}>
              {p.name}
            </AppText>
            <View style={styles.metaRow}>
              <View
                style={[styles.sourcePill, p.brand === 'Справочник' && styles.sourcePillRef]}
              >
                <AppText variant="caption" style={styles.sourcePillText}>
                  {p.brand === 'Справочник' ? 'справочник' : SOURCE_RU[p.source] ?? p.source}
                </AppText>
              </View>
              {p.brand && p.brand !== 'Справочник' ? (
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {p.brand}
                </AppText>
              ) : null}
            </View>
            <MacroStrip
              energyKcal={p.energyKcal}
              proteinG={p.proteinG}
              fatG={p.fatG}
              carbG={p.carbG}
            />
          </View>
        </Pressable>
        <Pressable
          onPress={() => onToggleFavorite(p)}
          accessibilityRole="button"
          accessibilityLabel={
            p.isFavorite ? `Убрать из избранного ${p.name}` : `Добавить в избранное ${p.name}`
          }
          hitSlop={8}
          style={styles.starHit}
        >
          <Ionicons
            name={p.isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={p.isFavorite ? colors.fat : colors.textMuted}
          />
        </Pressable>
        <Pressable
          onPress={() => onAddProduct(p)}
          accessibilityRole="button"
          accessibilityLabel={`Добавить порцию ${p.name}`}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={22} color={colors.primaryButtonText} />
        </Pressable>
      </View>
    );
  };

  const virtualize = rows.length >= CATALOG_VIRTUALIZE_THRESHOLD;

  return (
    <FlatList
      style={styles.list}
      data={rows}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      ListHeaderComponent={header}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={virtualize ? 12 : rows.length}
      windowSize={virtualize ? 7 : 21}
      removeClippedSubviews={virtualize}
      testID="food-catalog-list"
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 140 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    gap: space.sm,
  },
  sectionText: { flex: 1, minWidth: 0 },
  section: { fontWeight: '800' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: touchMin,
    paddingHorizontal: space.sm,
  },
  link: { fontWeight: '700' },
  sub: {
    marginBottom: space.sm,
    marginTop: space.sm,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  block: { marginBottom: space.md },
  filters: {
    flexDirection: 'row',
    gap: space.sm,
    paddingRight: space.sm,
    marginBottom: space.md,
  },
  pressed: { opacity: 0.88 },
  recentStrip: { gap: space.sm, paddingRight: space.md },
  recentCard: {
    width: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    minHeight: 112,
    gap: 4,
  },
  recentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  recentName: { fontWeight: '700', minHeight: 36 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: space.sm,
    minHeight: touchMin,
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.sm,
    minHeight: touchMin,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
  },
  thumbEmpty: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontWeight: '600' },
  nameFlex: { fontWeight: '600', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  sourcePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourcePillRef: { backgroundColor: colors.accentSoft },
  sourcePillText: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  starHit: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: touchMin,
    height: touchMin,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
