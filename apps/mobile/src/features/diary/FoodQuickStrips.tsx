import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry, FoodProduct, SavedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

/**
 * Compact quick-repeat rail under today's meal slots.
 * Pill chips only — no heavy cards competing with the diary.
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
  const saved = savedMeals.slice(0, 6);
  const recentItems = recent.slice(0, 6);
  const favItems = favorites.slice(0, 4);
  if (saved.length === 0 && recentItems.length === 0 && favItems.length === 0) {
    return (
      <Pressable
        onPress={onOpenSavedInSheet}
        style={({ pressed }) => [styles.footerHint, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Как сохранить приём пищи"
        testID="food-quick-strips"
      >
        <Ionicons name="bookmark-outline" size={16} color={colors.textMuted} />
        <AppText variant="caption" tone="muted" style={styles.footerHintText}>
          Закладка на приёме → шаблон в «Мои приёмы»
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap} testID="food-quick-strips">
      <AppText variant="label" tone="muted" style={styles.sectionLabel}>
        Быстрый повтор
      </AppText>

      {saved.length > 0 ? (
        <View style={styles.rail}>
          <View style={styles.railHead}>
            <AppText variant="caption" style={styles.railTitle}>
              Мои приёмы
            </AppText>
            <Pressable
              onPress={onOpenSavedInSheet}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Все сохранённые приёмы"
            >
              <AppText variant="caption" tone="secondary">
                все
              </AppText>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {saved.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => onLogSaved(m)}
                style={({ pressed }) => [styles.pill, styles.pillSaved, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Добавить приём ${m.name}`}
              >
                <Ionicons name="bookmark" size={14} color={colors.ink} />
                <AppText variant="caption" style={styles.pillText} numberOfLines={1}>
                  {m.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {recentItems.length > 0 ? (
        <View style={styles.rail}>
          <AppText variant="caption" style={styles.railTitleSolo}>
            Недавние
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {recentItems.map((e) => {
              const canQuick = e.productId != null || e.recipeId != null;
              return (
                <View key={e.id} style={styles.pillGroup}>
                  <Pressable
                    onPress={() => onRecentConfirm(e)}
                    style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.displayName}, выбрать порцию`}
                  >
                    <AppText variant="caption" style={styles.pillText} numberOfLines={1}>
                      {e.displayName}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {e.grams} г
                    </AppText>
                  </Pressable>
                  {canQuick ? (
                    <Pressable
                      onPress={() => onRecentQuick(e)}
                      style={({ pressed }) => [styles.miniPlus, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Быстро добавить ${e.displayName}`}
                      hitSlop={4}
                    >
                      <Ionicons name="add" size={16} color={colors.onAccent} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {favItems.length > 0 ? (
        <View style={styles.rail}>
          <AppText variant="caption" style={styles.railTitleSolo}>
            Избранное
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {favItems.map((p) => {
              const g = lastGramsFor(p.id);
              return (
                <View key={p.id} style={styles.pillGroup}>
                  <Pressable
                    onPress={() => onFavoriteConfirm(p, g)}
                    style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}, выбрать порцию`}
                  >
                    <Ionicons name="star" size={12} color={colors.fat} />
                    <AppText variant="caption" style={styles.pillText} numberOfLines={1}>
                      {p.name}
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => onFavoriteQuick(p, g)}
                    style={({ pressed }) => [styles.miniPlus, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Быстро добавить ${p.name}`}
                    hitSlop={4}
                  >
                    <Ionicons name="add" size={16} color={colors.onAccent} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  rail: { gap: space.xs },
  railHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railTitle: { fontWeight: '600' },
  railTitleSolo: { fontWeight: '600' },
  chips: {
    gap: space.sm,
    paddingVertical: 2,
    paddingRight: space.lg,
    alignItems: 'center',
  },
  pillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 168,
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillSaved: {
    backgroundColor: colors.accentSoft,
  },
  pillText: {
    fontWeight: '600',
    flexShrink: 1,
  },
  miniPlus: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: touchMin,
  },
  footerHintText: { flex: 1 },
  pressed: { opacity: 0.85 },
});
