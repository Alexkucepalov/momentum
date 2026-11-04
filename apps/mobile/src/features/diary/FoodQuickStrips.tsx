import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry, FoodProduct, SavedMeal } from '../../../../../src/storage/types';
import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';

const MEAL_RU = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус',
} as const;

/**
 * Pleasant horizontal strips for Food diary: saved meals, recent, favorites.
 * Saved meals = bookmark templates (findable path for «любимый завтрак»).
 */
export function FoodQuickStrips({
  savedMeals,
  recent,
  favorites,
  lastGramsFor,
  onLogSaved,
  onRecentConfirm,
  onRecentQuick,
  onFavoriteConfirm,
  onFavoriteQuick,
  onOpenSavedInSheet,
}: {
  savedMeals: SavedMeal[];
  recent: FoodEntry[];
  favorites: FoodProduct[];
  lastGramsFor: (productId: string) => number;
  onLogSaved: (meal: SavedMeal) => void;
  onRecentConfirm: (entry: FoodEntry) => void;
  onRecentQuick: (entry: FoodEntry) => void;
  onFavoriteConfirm: (product: FoodProduct, grams: number) => void;
  onFavoriteQuick: (product: FoodProduct, grams: number) => void;
  onOpenSavedInSheet: () => void;
}) {
  const hasSaved = savedMeals.length > 0;
  const hasRecent = recent.length > 0;
  const hasFav = favorites.length > 0;
  if (!hasSaved && !hasRecent && !hasFav) return null;

  return (
    <View style={styles.wrap} testID="food-quick-strips">
      {hasSaved ? (
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="bookmark" size={16} color={colors.accent} />
            <AppText variant="subtitle" style={styles.blockTitle}>
              Мои приёмы
            </AppText>
            <Pressable
              onPress={onOpenSavedInSheet}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Все сохранённые приёмы"
            >
              <AppText variant="caption" tone="accent">
                все
              </AppText>
            </Pressable>
          </View>
          <AppText variant="caption" tone="muted" style={styles.hint}>
            Шаблоны с закладки · тап — сразу в дневник
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {savedMeals.slice(0, 8).map((m) => (
              <Pressable
                key={m.id}
                onPress={() => onLogSaved(m)}
                style={({ pressed }) => [pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Добавить приём ${m.name}`}
              >
                <AppCard style={styles.savedChip}>
                  <View style={styles.savedIcon}>
                    <Ionicons name="restaurant" size={16} color={colors.accent} />
                  </View>
                  <AppText variant="body" style={styles.chipTitle} numberOfLines={1}>
                    {m.name}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {m.defaultMeal ? MEAL_RU[m.defaultMeal] : 'приём'} · {m.items.length} поз.
                  </AppText>
                </AppCard>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Pressable
          onPress={onOpenSavedInSheet}
          style={({ pressed }) => [styles.emptySaved, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Как сохранить приём пищи"
        >
          <Ionicons name="bookmark-outline" size={18} color={colors.accent} />
          <View style={styles.emptySavedText}>
            <AppText variant="body" style={styles.chipTitle}>
              Сохранённые приёмы
            </AppText>
            <AppText variant="caption" tone="muted">
              Закладка на завтраке/обеде → шаблон появится здесь
            </AppText>
          </View>
        </Pressable>
      )}

      {hasRecent ? (
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="time-outline" size={16} color={colors.carbs} />
            <AppText variant="subtitle" style={styles.blockTitle}>
              Недавние
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {recent.slice(0, 8).map((e) => {
              const canQuick = e.productId != null || e.recipeId != null;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => onRecentConfirm(e)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.displayName}, выбрать порцию`}
                >
                  <AppCard style={styles.itemChip}>
                    <AppText variant="body" style={styles.chipTitle} numberOfLines={1}>
                      {e.displayName}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {e.grams} г
                    </AppText>
                    {canQuick ? (
                      <Pressable
                        onPress={(ev) => {
                          ev.stopPropagation?.();
                          onRecentQuick(e);
                        }}
                        style={styles.plus}
                        accessibilityRole="button"
                        accessibilityLabel={`Быстро добавить ${e.displayName}`}
                        hitSlop={6}
                      >
                        <Ionicons name="add" size={18} color={colors.onAccent} />
                      </Pressable>
                    ) : null}
                  </AppCard>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {hasFav ? (
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Ionicons name="star" size={16} color={colors.fat} />
            <AppText variant="subtitle" style={styles.blockTitle}>
              Избранное
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {favorites.slice(0, 8).map((p) => {
              const g = lastGramsFor(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => onFavoriteConfirm(p, g)}
                  style={({ pressed }) => [pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}, выбрать порцию`}
                >
                  <AppCard style={styles.itemChip}>
                    <AppText variant="body" style={styles.chipTitle} numberOfLines={1}>
                      {p.name}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      обычно {g} г
                    </AppText>
                    <Pressable
                      onPress={(ev) => {
                        ev.stopPropagation?.();
                        onFavoriteQuick(p, g);
                      }}
                      style={[styles.plus, styles.plusFav]}
                      accessibilityRole="button"
                      accessibilityLabel={`Быстро добавить ${p.name}`}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={18} color={colors.onAccent} />
                    </Pressable>
                  </AppCard>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, marginBottom: space.sm },
  block: { gap: space.xs },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  blockTitle: { flex: 1, fontWeight: '700' },
  hint: { marginBottom: 2 },
  row: { gap: space.sm, paddingVertical: space.xs, paddingRight: space.lg },
  savedChip: {
    width: 148,
    gap: 4,
    padding: space.md,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  savedIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  itemChip: {
    width: 140,
    gap: 4,
    padding: space.md,
    paddingBottom: space.sm,
  },
  chipTitle: { fontWeight: '600' },
  plus: {
    marginTop: space.xs,
    alignSelf: 'flex-start',
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusFav: { backgroundColor: colors.fat },
  emptySaved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    minHeight: touchMin,
  },
  emptySavedText: { flex: 1, gap: 2, minWidth: 0 },
  pressed: { opacity: 0.88 },
});
