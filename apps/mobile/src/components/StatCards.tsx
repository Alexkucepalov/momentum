import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppCard, AppText, colors, space } from '../design-system';

/** Compact water + activity — food logging lives in AddFoodBlock / KcalRing. */
export function StatCards({
  waterMl,
  waterTargetMl,
  activityMinutes,
  onAddWater,
}: {
  waterMl: number;
  waterTargetMl: number | null;
  activityMinutes: number;
  onAddWater: (ml: number) => void;
}) {
  const router = useRouter();
  const waterLabel =
    waterTargetMl && waterTargetMl > 0
      ? `${(waterMl / 1000).toFixed(1)} / ${(waterTargetMl / 1000).toFixed(1)} л`
      : waterMl > 0
        ? `${(waterMl / 1000).toFixed(1)} л`
        : '0 л';

  return (
    <View style={styles.row} testID="today-stat-cards">
      <Pressable
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
        onPress={() => onAddWater(250)}
        accessibilityRole="button"
        accessibilityLabel={`Вода ${waterLabel}. Добавить 250 миллилитров`}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="water-outline" size={18} color={colors.ink} />
            <AppText variant="label" tone="secondary">
              Вода
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.value}>
            {waterLabel}
          </AppText>
          <AppText variant="caption" tone="accent">
            +250 мл
          </AppText>
        </AppCard>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
        onPress={() => router.push('/activity')}
        accessibilityRole="button"
        accessibilityLabel={`Активность ${activityMinutes} минут. Открыть вкладку`}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="walk-outline" size={18} color={colors.ink} />
            <AppText variant="label" tone="secondary">
              Активность
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.value}>
            {activityMinutes > 0 ? `${activityMinutes} мин` : '—'}
          </AppText>
          <AppText variant="caption" tone="muted">
            {activityMinutes > 0 ? 'открыть' : 'добавить'}
          </AppText>
        </AppCard>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  press: {
    flex: 1,
  },
  card: {
    minHeight: 96,
    gap: space.xs,
  },
  pressed: { opacity: 0.88 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: space.sm,
  },
  value: {
    fontWeight: '800',
  },
});
