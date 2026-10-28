import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { nothing, nothingRadius, nothingSpace, nothingType } from '../theme/nothing';
import { colors, radius, space, type } from '../theme/tokens';

/** Compact water + activity — food logging lives in AddFoodBlock / KcalRing. */
export function StatCards({
  waterMl,
  waterTargetMl,
  activityMinutes,
  onAddWater,
  tone = 'default',
}: {
  waterMl: number;
  waterTargetMl: number | null;
  activityMinutes: number;
  onAddWater: (ml: number) => void;
  tone?: 'default' | 'nothing';
}) {
  const n = tone === 'nothing';
  const router = useRouter();
  const waterLabel =
    waterTargetMl && waterTargetMl > 0
      ? `${(waterMl / 1000).toFixed(1)} / ${(waterTargetMl / 1000).toFixed(1)} л`
      : waterMl > 0
        ? `${(waterMl / 1000).toFixed(1)} л`
        : '0 л';

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.card, n && styles.cardN, pressed && styles.pressed]}
        onPress={() => onAddWater(250)}
        accessibilityRole="button"
        accessibilityLabel={`Вода ${waterLabel}. Добавить 250 миллилитров`}
      >
        <View style={styles.cardTop}>
          <Ionicons name="water-outline" size={18} color={n ? nothing.display : colors.text} />
          <Text style={[styles.title, n && styles.titleN]}>Вода</Text>
        </View>
        <Text style={[styles.value, n && styles.valueN]}>{waterLabel}</Text>
        <Text style={[styles.hintAction, n && styles.hintN]}>+250 мл</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.card, n && styles.cardN, pressed && styles.pressed]}
        onPress={() => router.push('/activity')}
        accessibilityRole="button"
        accessibilityLabel={`Активность ${activityMinutes} минут. Открыть вкладку`}
      >
        <View style={styles.cardTop}>
          <Ionicons name="walk-outline" size={18} color={n ? nothing.display : colors.text} />
          <Text style={[styles.title, n && styles.titleN]}>Активность</Text>
        </View>
        <Text style={[styles.value, n && styles.valueN]}>
          {activityMinutes > 0 ? `${activityMinutes} мин` : '—'}
        </Text>
        <Text style={[styles.hintAction, n && styles.hintN]}>
          {activityMinutes > 0 ? 'открыть' : 'добавить'}
        </Text>
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
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: 72,
  },
  pressed: { opacity: 0.88 },
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
  cardN: {
    borderRadius: nothingRadius.sm,
    borderColor: nothing.lineStrong,
    backgroundColor: nothing.surface,
    paddingVertical: nothingSpace.sm,
    paddingHorizontal: nothingSpace.md,
  },
  titleN: {
    color: nothing.muted,
    letterSpacing: nothingType.letterWide,
  },
  valueN: { color: nothing.display },
  hintN: { color: nothing.secondary },
});
