import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FoodEntry } from '../../../../../src/storage/types';
import { SectionHeader } from '@/src/components/SectionHeader';
import { AppCard, AppText, colors, radius, space } from '@/src/design-system';

function fmtKcal(n: number | null): string {
  if (n === null) return '— ккал';
  return `~${Math.round(n)} ккал`;
}

/**
 * Above-fold recent strip for Today: row opens portion confirm;
 * trailing «+» one-taps last grams into the diary.
 */
export function TodayRecentStrip({
  recent,
  onConfirm,
  onQuickAdd,
}: {
  recent: FoodEntry[];
  onConfirm: (entry: FoodEntry) => void;
  onQuickAdd: (entry: FoodEntry) => void;
}) {
  if (recent.length === 0) return null;

  return (
    <View style={styles.wrap} testID="today-recent-strip">
      <SectionHeader title="Недавние" />
      <AppText variant="caption" tone="muted" style={styles.hint}>
        «+» — сразу с прошлой порцией · строка — подтвердить граммы
      </AppText>
      {recent.map((e) => {
        const canQuick = e.productId != null || e.recipeId != null;
        return (
          <Pressable
            key={e.id}
            style={({ pressed }) => [pressed && styles.pressed]}
            onPress={() => onConfirm(e)}
            accessibilityRole="button"
            accessibilityLabel={`${e.displayName}, ${e.grams} грамм. Выбрать порцию`}
          >
            <AppCard style={styles.row}>
              <View style={styles.iconBubble}>
                <Ionicons name="time-outline" size={16} color={colors.ink} />
              </View>
              <View style={styles.body}>
                <AppText variant="body" style={styles.title} numberOfLines={1}>
                  {e.displayName}
                </AppText>
                <AppText variant="caption" tone="secondary" numberOfLines={1}>
                  {e.grams} г · {fmtKcal(e.energyKcal)}
                </AppText>
              </View>
              {canQuick ? (
                <Pressable
                  onPress={(ev) => {
                    ev.stopPropagation?.();
                    onQuickAdd(e);
                  }}
                  style={({ pressed }) => [styles.plusHit, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Быстро добавить ${e.displayName}, ${e.grams} грамм`}
                  hitSlop={6}
                  testID={`today-recent-quick-${e.id}`}
                >
                  <AppText variant="title">+</AppText>
                </Pressable>
              ) : null}
            </AppCard>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  hint: { marginBottom: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginBottom: space.xs,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { fontWeight: '600' },
  plusHit: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
