import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry, SavedMeal } from '../../../../../src/storage/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

type RailTab = 'saved' | 'recent';

/**
 * Quiet “repeat” panel under today's meals.
 * Segment + simple rows (no horizontal chip clutter).
 */
export function FoodQuickStrips({
  savedMeals,
  recent,
  onLogSaved,
  onRecentConfirm,
  onRecentQuick,
  onOpenSavedInSheet,
}: {
  savedMeals: SavedMeal[];
  recent: FoodEntry[];
  /** @deprecated kept optional for call-site compatibility */
  favorites?: unknown;
  lastGramsFor?: (productId: string) => number;
  onLogSaved: (meal: SavedMeal) => void;
  onRecentConfirm: (entry: FoodEntry) => void;
  onRecentQuick: (entry: FoodEntry) => void;
  onFavoriteConfirm?: (product: never, grams: number) => void;
  onFavoriteQuick?: (product: never, grams: number) => void;
  onOpenSavedInSheet: () => void;
}) {
  const saved = savedMeals.slice(0, 5);
  const recentItems = recent.slice(0, 5);
  const defaultTab: RailTab = saved.length > 0 ? 'saved' : 'recent';
  const [tab, setTab] = useState<RailTab>(defaultTab);

  if (saved.length === 0 && recentItems.length === 0) {
    return (
      <Pressable
        onPress={onOpenSavedInSheet}
        style={({ pressed }) => [styles.empty, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Как сохранить приём пищи"
        testID="food-quick-strips"
      >
        <AppText variant="caption" tone="muted">
          Закладка на приёме сохранит шаблон сюда
        </AppText>
      </Pressable>
    );
  }

  const activeTab: RailTab =
    tab === 'saved' && saved.length === 0
      ? 'recent'
      : tab === 'recent' && recentItems.length === 0
        ? 'saved'
        : tab;

  return (
    <View style={styles.wrap} testID="food-quick-strips">
      <View style={styles.head}>
        <AppText variant="subtitle" style={styles.headTitle}>
          Повторить
        </AppText>
        {saved.length > 0 ? (
          <Pressable
            onPress={onOpenSavedInSheet}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Все сохранённые приёмы"
          >
            <AppText variant="caption" tone="secondary">
              все шаблоны
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        <Pressable
          style={[styles.segBtn, activeTab === 'saved' && styles.segBtnOn]}
          onPress={() => setTab('saved')}
          disabled={saved.length === 0}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'saved', disabled: saved.length === 0 }}
          accessibilityLabel="Мои приёмы"
        >
          <AppText
            variant="caption"
            tone={activeTab === 'saved' ? 'inverse' : saved.length === 0 ? 'muted' : 'ink'}
            style={styles.segLabel}
          >
            Мои приёмы
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.segBtn, activeTab === 'recent' && styles.segBtnOn]}
          onPress={() => setTab('recent')}
          disabled={recentItems.length === 0}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'recent', disabled: recentItems.length === 0 }}
          accessibilityLabel="Недавние"
        >
          <AppText
            variant="caption"
            tone={activeTab === 'recent' ? 'inverse' : recentItems.length === 0 ? 'muted' : 'ink'}
            style={styles.segLabel}
          >
            Недавние
          </AppText>
        </Pressable>
      </View>

      <View style={styles.list}>
        {activeTab === 'saved'
          ? saved.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() => onLogSaved(m)}
                style={({ pressed }) => [
                  styles.row,
                  i === saved.length - 1 && styles.rowLast,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Добавить приём ${m.name}`}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="bookmark-outline" size={16} color={colors.ink} />
                </View>
                <View style={styles.rowBody}>
                  <AppText variant="body" style={styles.rowTitle} numberOfLines={1}>
                    {m.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {m.items.length} поз. · тап — в дневник
                  </AppText>
                </View>
                <View style={styles.rowAdd}>
                  <Ionicons name="add" size={18} color={colors.onAccent} />
                </View>
              </Pressable>
            ))
          : recentItems.map((e, i) => {
              const canQuick = e.productId != null || e.recipeId != null;
              return (
                <View
                  key={e.id}
                  style={[styles.row, i === recentItems.length - 1 && styles.rowLast]}
                >
                  <Pressable
                    onPress={() => onRecentConfirm(e)}
                    style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.displayName}, выбрать порцию`}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name="time-outline" size={16} color={colors.ink} />
                    </View>
                    <View style={styles.rowBody}>
                      <AppText variant="body" style={styles.rowTitle} numberOfLines={1}>
                        {e.displayName}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {e.grams} г
                      </AppText>
                    </View>
                  </Pressable>
                  {canQuick ? (
                    <Pressable
                      onPress={() => onRecentQuick(e)}
                      style={({ pressed }) => [styles.rowAdd, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Быстро добавить ${e.displayName}`}
                    >
                      <Ionicons name="add" size={18} color={colors.onAccent} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  headTitle: { fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    gap: 2,
  },
  segBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  segBtnOn: {
    backgroundColor: colors.ink,
  },
  segLabel: { fontWeight: '700' },
  list: {
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchMin,
    paddingLeft: space.md,
    paddingRight: space.sm,
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    minWidth: 0,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 1, minWidth: 0, paddingVertical: space.sm },
  rowTitle: { fontWeight: '600' },
  rowAdd: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  empty: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
