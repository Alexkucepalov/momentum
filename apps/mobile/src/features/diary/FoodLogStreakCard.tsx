import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  formatFoodLogStreakRu,
  type FoodLogStreak,
} from '../../../../../src/domain/foodLogStreak';
import { AppCard, AppText, colors, radius, space } from '@/src/design-system';

/** Soft motivation for consecutive food-log days — no shame for breaks. */
export function FoodLogStreakCard({ streak }: { streak: FoodLogStreak }) {
  const copy = formatFoodLogStreakRu(streak);
  const lit = Math.min(7, Math.max(0, streak.current));

  return (
    <AppCard
      style={styles.card}
      accessibilityLabel={`${copy.title}. ${copy.body}`}
      testID="food-log-streak-card"
    >
      <View style={styles.top}>
        <Ionicons name="flame" size={18} color={colors.fat} />
        <AppText variant="body" style={styles.title}>
          {copy.title}
        </AppText>
        <View style={styles.dots} accessibilityElementsHidden>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.dot, i < lit ? styles.dotOn : styles.dotOff]} />
          ))}
        </View>
      </View>
      <AppText variant="caption" tone="muted">
        {copy.body}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.xs,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  title: { fontWeight: '700', flexShrink: 1 },
  dots: { flexDirection: 'row', gap: 3, marginLeft: 'auto' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: colors.fat },
  dotOff: { backgroundColor: colors.surface },
});
