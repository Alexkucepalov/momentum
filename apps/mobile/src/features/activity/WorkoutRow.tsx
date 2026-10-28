import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Workout, WorkoutType } from '../../../../../src/storage/types';
import { colors, radius, space, surfaceCard, touchMin, type } from '../../theme/tokens';

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
}: {
  workout: Workout;
  onDelete: () => void;
}) {
  const meta = TYPE_META[workout.type];
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name={meta.icon} size={18} color={colors.text} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{titleFor(workout)}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {metaFor(workout)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...surfaceCard,
    flexDirection: 'row',
    alignItems: 'center',
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
});
