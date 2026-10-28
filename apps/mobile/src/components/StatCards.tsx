import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, space, type } from '../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

/** Compact water + activity rows (optional; Today prefers quiet single water row). */
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
    <View style={styles.row}>
      <AppCard
        padding="none"
        style={styles.card}
        onPress={() => onAddWater(250)}
        accessibilityRole="button"
        accessibilityLabel={`Вода ${waterLabel}. Добавить 250 миллилитров`}
      >
        <View style={styles.cardTop}>
          <Ionicons name="water-outline" size={18} color={colors.text} />
          <Text style={styles.title}>Вода</Text>
        </View>
        <Text style={styles.value}>{waterLabel}</Text>
        <Text style={styles.hintAction}>+250 мл</Text>
      </AppCard>
      <AppCard
        padding="none"
        style={styles.card}
        onPress={() => router.push('/activity')}
        accessibilityRole="button"
        accessibilityLabel={`Активность ${activityMinutes} минут. Открыть вкладку`}
      >
        <View style={styles.cardTop}>
          <Ionicons name="walk-outline" size={18} color={colors.text} />
          <Text style={styles.title}>Активность</Text>
        </View>
        <Text style={styles.value}>{activityMinutes > 0 ? `${activityMinutes} мин` : '—'}</Text>
        <Text style={styles.hintAction}>{activityMinutes > 0 ? 'открыть' : 'добавить'}</Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  card: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: 72,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
  },
  hintAction: {
    marginTop: 2,
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
  },
});
