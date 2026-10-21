import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { sortProductsByFrequency } from '../../../../../src/domain/productFrequency';
import type { FoodEntry, FoodProduct, Recipe } from '../../../../../src/storage/types';
import { MacroStrip } from '../../components/MacroStrip';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

const SOURCE_RU: Record<string, string> = {
  user: 'свой',
  catalog: 'каталог',
  label: 'этикетка',
  recipe: 'рецепт',
  missing: 'нет данных',
};

export type CatalogFilter = 'all' | 'favorites' | 'frequent' | 'recent' | 'recipes';

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
  onToggleFavorite,
  onRepeatEntry,
}: {
  filter: CatalogFilter;
  onFilterChange: (f: CatalogFilter) => void;
  products: FoodProduct[];
  recipes: Recipe[];
  recent: FoodEntry[];
  /** Local frequency index (diary) — ranked, no invented rows. */
  frequent: FoodProduct[];
  query: string;
  /** Optional map recipeId → ingredient count for richer cards. */
  recipeIngredientCounts?: Record<string, number>;
  onAddProduct: (p: FoodProduct) => void;
  onAddRecipe: (r: Recipe) => void;
  onOpenRecipe?: (r: Recipe) => void;
  onBrowseRecipes?: () => void;
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

  const filteredProducts = (() => {
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
  })();

  const filteredRecipes = recipes.filter((r) => {
    if (!searching) {
      if (filter !== 'recipes' && filter !== 'all') return false;
      return true;
    }
    if (filter === 'favorites' || filter === 'recent' || filter === 'frequent') return false;
    return r.name.toLowerCase().includes(q);
  });

  const recentUnique = (() => {
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
  })();

  const favoriteCount = products.filter((p) => p.isFavorite).length;
  const showRecent = filter === 'recent' || (filter === 'all' && !searching);
  const showFrequentStrip = filter === 'all' && !searching && frequent.length > 0;
  const showProducts =
    searching || filter === 'all' || filter === 'favorites' || filter === 'frequent';
  const showRecipes =
    searching || filter === 'recipes' || (filter === 'all' && recipes.length > 0);

  const anyHits =
    filteredProducts.length > 0 ||
    filteredRecipes.length > 0 ||
    (showRecent && recentUnique.length > 0) ||
    (filter === 'frequent' && frequent.length > 0);

  const filters: Array<{
    id: CatalogFilter;
    label: string;
    count: number;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: 'all', label: 'Все', count: products.length + recipes.length, icon: 'grid-outline' },
    { id: 'frequent', label: 'Частые', count: frequent.length, icon: 'flash-outline' },
    { id: 'favorites', label: 'Избр.', count: favoriteCount, icon: 'star-outline' },
    { id: 'recent', label: 'Недавн.', count: recentUnique.length, icon: 'time-outline' },
    { id: 'recipes', label: 'Рецепты', count: recipes.length, icon: 'restaurant-outline' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.section} accessibilityRole="header">
              {searching ? 'Результаты' : 'Каталог'}
            </Text>
            {!searching ? (
              <Text style={styles.sectionLead}>Справочник, свои продукты и рецепты</Text>
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
              <Text style={styles.link}>Все рецепты</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
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
          {filters.map(({ id, label, count, icon }) => {
            const on = filter === id;
            return (
              <Pressable
                key={id}
                onPress={() => onFilterChange(id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  on && styles.filterChipOn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                  accessibilityLabel={`Фильтр ${label}: ${count}`}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={on ? colors.primaryButtonText : colors.textSecondary}
                />
                <Text style={[styles.filterText, on && styles.filterTextOn]}>{label}</Text>
                <View style={[styles.countPill, on && styles.countPillOn]}>
                  <Text style={[styles.countText, on && styles.countTextOn]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      </View>

      {searching && !anyHits ? (
        <Text style={styles.hint}>
          Ничего не найдено. Попробуй другое слово, просмотри весь каталог или создай продукт вручную
        </Text>
      ) : null}

      {showRecent && recentUnique.length > 0 ? (
        <View style={styles.block}>
          {filter === 'all' ? <Text style={styles.sub}>Быстрый повтор</Text> : null}
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
                accessibilityLabel={`Повторить ${e.displayName}, ${e.grams} грамм`}
              >
                <View style={styles.recentIcon}>
                  <Ionicons name="refresh" size={16} color={colors.text} />
                </View>
                <Text style={styles.recentName} numberOfLines={2}>
                  {e.displayName}
                </Text>
                <Text style={styles.recentMeta}>
                  {e.grams} г ·{' '}
                  {e.energyKcal === null ? '—' : `${Math.round(e.energyKcal)} ккал`}
                </Text>
                <Text style={styles.recentAdd}>+ в дневник</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showFrequentStrip ? (
        <View style={styles.block}>
          <Text style={styles.sub}>Частые продукты</Text>
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
                  <Ionicons name="flash-outline" size={16} color={colors.text} />
                </View>
                <Text style={styles.recentName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.recentMeta}>
                  {p.energyKcal === null ? '— ккал/100г' : `${Math.round(p.energyKcal)} ккал/100г`}
                </Text>
                <Text style={styles.recentAdd}>+ порция</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showRecipes && filteredRecipes.length > 0 ? (
        <View style={styles.block}>
          {filter === 'all' ? <Text style={styles.sub}>Рецепты</Text> : null}
          {filteredRecipes.map((r) => {
            const ingCount = recipeIngredientCounts?.[r.id] ?? 0;
            return (
              <View key={r.id} style={styles.card}>
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
                    <Text style={styles.name} numberOfLines={2}>
                      {r.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      Выход {r.cookedYieldG} г
                      {ingCount > 0 ? ` · ${ingCount} ингр.` : ''}
                    </Text>
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
          })}
        </View>
      ) : null}

      {showProducts ? (
        <View style={styles.block}>
          {filter === 'all' && filteredProducts.length > 0 ? (
            <Text style={styles.sub}>Продукты</Text>
          ) : null}
          {filteredProducts.length === 0 && !searching && filter !== 'all' ? (
            <Text style={styles.hint}>
              {filter === 'favorites'
                ? 'Избранных продуктов пока нет. Нажми ★ у продукта, чтобы добавить в избранное'
                : 'Создай продукт вручную или добавь через сканер штрихкода'}
            </Text>
          ) : filteredProducts.length === 0 && !searching && filter === 'all' ? (
            <Text style={styles.hint}>
              Создай первый продукт вручную, через сканер или добавь рецепт
            </Text>
          ) : (
            filteredProducts.map((p) => (
              <View key={p.id} style={styles.card}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => onAddProduct(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`Добавить продукт ${p.name}, ${p.energyKcal === null ? 'калорийность неизвестна' : `${Math.round(p.energyKcal)} калорий на 100 грамм`}`}
                >
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="nutrition-outline" size={22} color={colors.textMuted} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.nameFlex} numberOfLines={2}>
                      {p.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.sourcePill,
                          p.brand === 'Справочник' && styles.sourcePillRef,
                        ]}
                      >
                        <Text style={styles.sourcePillText}>
                          {p.brand === 'Справочник'
                            ? 'справочник'
                            : SOURCE_RU[p.source] ?? p.source}
                        </Text>
                      </View>
                      {p.brand && p.brand !== 'Справочник' ? (
                        <Text style={styles.meta} numberOfLines={1}>
                          {p.brand}
                        </Text>
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
                    p.isFavorite
                      ? `Убрать из избранного ${p.name}`
                      : `Добавить в избранное ${p.name}`
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
            ))
          )}
        </View>
      ) : null}

      {filter === 'recent' && recentUnique.length === 0 ? (
        <Text style={styles.hint}>Пока нет недавних записей</Text>
      ) : null}
      {filter === 'frequent' && frequent.length === 0 ? (
        <Text style={styles.hint}>
          Частые продукты появятся после нескольких записей в дневник. Индекс строится только из
          твоих логов
        </Text>
      ) : null}
      {filter === 'recipes' && filteredRecipes.length === 0 ? (
        <View>
          <Text style={styles.hint}>Рецептов пока нет</Text>
          {onBrowseRecipes ? (
            <Pressable
              onPress={onBrowseRecipes}
              style={styles.emptyCta}
              accessibilityRole="button"
              accessibilityLabel="Создать рецепт"
            >
              <Text style={styles.emptyCtaText}>Открыть раздел рецептов</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: space.sm, marginBottom: space.xl },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.md,
    gap: space.sm,
  },
  section: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLead: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginTop: 2,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  link: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  sub: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: space.sm,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  block: { marginBottom: space.md },
  filters: {
    flexDirection: 'row',
    gap: space.sm,
    paddingRight: space.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: space.md,
    paddingRight: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: touchMin,
  },
  filterChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  pressed: { opacity: 0.88 },
  filterText: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  filterTextOn: { color: colors.primaryButtonText },
  countPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  countText: { fontSize: type.micro, fontWeight: '800', color: colors.text },
  countTextOn: { color: colors.primaryButtonText },
  hint: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginHorizontal: space.md,
    marginBottom: space.md,
  },
  recentStrip: { gap: space.sm, paddingRight: space.md },
  recentCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    minHeight: 120,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  recentName: { fontSize: type.caption, fontWeight: '700', color: colors.text, minHeight: 34 },
  recentMeta: { fontSize: type.micro, color: colors.textSecondary, marginTop: 4 },
  recentAdd: {
    marginTop: space.sm,
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.text,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.sm,
    marginBottom: space.sm,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    minHeight: touchMin,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, paddingVertical: 2 },
  name: { fontSize: type.body, fontWeight: '700', color: colors.text },
  nameFlex: { flex: 1, fontSize: type.body, fontWeight: '700', color: colors.text },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: 4,
  },
  sourcePill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  sourcePillRef: {
    backgroundColor: colors.successSoft,
  },
  sourcePillText: {
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  starHit: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  addBtn: {
    width: touchMin,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCta: {
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyCtaText: { fontWeight: '700', color: colors.text },
});
