import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

import type { Workout, WorkoutType } from '../../../../../src/storage/types';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

const TYPE_META: Record<
  WorkoutType,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  walking: { label: 'Ходьба', icon: 'walk-outline' },
  cycling: { label: 'Вело', icon: 'bicycle-outline' },
  strength: { label: 'Сила', icon: 'barbell-outline' },
  football: { label: 'Футбол', icon: 'football-outline' },
  other: { label: 'Другое', icon: 'fitness-outline' },
};

function titleFor(w: Workout): string {
  if (w.type === 'other' && w.notes) {
    const head = w.notes.split(' · ')[0]?.trim();
    if (head) return head;
  }
  return TYPE_META[w.type].label;
}

function metaFor(w: Workout): string {
  const mins = Math.round(w.durationSec / 60);
  const parts = [`${mins} мин`];
  if (w.distanceM != null) {
    parts.push(`${(w.distanceM / 1000).toFixed(2)} км`);
  }
  if (w.source === 'garmin') parts.push('Garmin');
  if (w.notes) {
    // For "other", title already took first segment — show rest if any.
    if (w.type === 'other') {
      const rest = w.notes.split(' · ').slice(1).join(' · ');
      if (rest) parts.push(rest);
    } else {
      parts.push(w.notes);
    }
  }
  return parts.join(' · ');
}

export function WorkoutRow({
  workout,
  onDelete,
  onPress,
}: {
  workout: Workout;
  onDelete: () => void;
  onPress?: () => void;
}) {
  const meta = TYPE_META[workout.type];
  const extras: string[] = [];
  if (workout.calories != null) extras.push(`${Math.round(workout.calories)} ккал`);
  if (workout.avgHeartRate != null) extras.push(`${Math.round(workout.avgHeartRate)} уд`);
  if (workout.avgPowerW != null) extras.push(`${Math.round(workout.avgPowerW)} Вт`);
  const line = [metaFor(workout), ...extras].join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Открыть ${titleFor(workout)}` : undefined}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}
    >
      <View style={styles.icon}>
        <Ionicons name={meta.icon} size={18} color={colors.text} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{titleFor(workout)}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {line}
        </Text>
      </View>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Удалить ${titleFor(workout)}`}
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={20} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    minHeight: touchMin,
    gap: space.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontWeight: '700', color: colors.text, fontSize: type.body },
  meta: { color: colors.textSecondary, fontSize: type.caption, marginTop: 2 },
  delete: {
    minWidth: 40,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  rowPressed: { opacity: 0.92 },
});
