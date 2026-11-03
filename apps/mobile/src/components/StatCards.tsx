import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { AppCard, AppText, colors, space } from '../design-system';

function fmtSleepHours(sleepSec: number | null | undefined): string {
  if (sleepSec == null) return '—';
  const h = sleepSec / 3600;
  return `${Math.round(h * 10) / 10} ч`;
}

function fmtSteps(steps: number | null | undefined): string {
  if (steps == null) return '—';
  return steps.toLocaleString('ru-RU');
}

/**
 * Today day glance: water · steps · sleep · activity.
 * Unknown stays «—» (never invent 0 for missing Garmin/sleep).
 */
export function StatCards({
  waterMl,
  waterTargetMl,
  activityMinutes,
  steps,
  sleepSec,
  onAddWater,
}: {
  waterMl: number;
  waterTargetMl: number | null;
  activityMinutes: number;
  steps: number | null;
  sleepSec: number | null;
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
    <View style={styles.grid} testID="today-stat-cards">
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
        accessibilityLabel={`Шаги ${fmtSteps(steps)}. Открыть движение`}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="footsteps-outline" size={18} color={colors.ink} />
            <AppText variant="label" tone="secondary">
              Шаги
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.value}>
            {fmtSteps(steps)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {steps == null ? 'нет данных' : 'движение'}
          </AppText>
        </AppCard>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
        onPress={() => router.push('/sleep' as Href)}
        accessibilityRole="button"
        accessibilityLabel={`Сон ${fmtSleepHours(sleepSec)}. Открыть сон`}
      >
        <AppCard style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="moon-outline" size={18} color={colors.ink} />
            <AppText variant="label" tone="secondary">
              Сон
            </AppText>
          </View>
          <AppText variant="subtitle" style={styles.value}>
            {fmtSleepHours(sleepSec)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {sleepSec == null ? 'нет данных' : 'ночь'}
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
            <Ionicons name="barbell-outline" size={18} color={colors.ink} />
            <AppText variant="label" tone="secondary">
              Тренировки
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  press: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '47%',
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
