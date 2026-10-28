import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, surfaceCard, touchMin, type } from '@/src/theme/tokens';

/** Ref 01 — Workouts | Meals with black pill CTAs. */
export function HomeActionCards({
  onStartWorkout,
  onLogMeal,
}: {
  onStartWorkout: () => void;
  onLogMeal: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.title}>Активность</Text>
        <Text style={styles.sub}>Тренировки и минуты</Text>
        <Pressable
          onPress={onStartWorkout}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Начать активность"
        >
          <Text style={styles.ctaText}>Начать</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Еда</Text>
        <Text style={styles.sub}>Записать питание</Text>
        <Pressable
          onPress={onLogMeal}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Записать еду"
        >
          <Text style={styles.ctaText}>Записать</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  card: {
    ...surfaceCard,
    flex: 1,
    padding: space.lg,
    gap: space.sm,
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  cta: {
    marginTop: 'auto',
    minHeight: touchMin - 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.primaryButtonText,
  },
  pressed: { opacity: 0.88 },
});
