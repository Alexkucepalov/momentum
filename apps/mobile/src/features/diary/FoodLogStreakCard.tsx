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
        <View style={styles.iconWrap}>
          <Ionicons name="flame" size={20} color={colors.accent} />
        </View>
        <View style={styles.textCol}>
          <AppText variant="subtitle" style={styles.title}>
            {copy.title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {copy.body}
          </AppText>
        </View>
      </View>
      <View style={styles.dots} accessibilityElementsHidden>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < lit ? styles.dotOn : styles.dotOff]}
          />
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  top: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: colors.accent },
  dotOff: { backgroundColor: colors.surface },
});
