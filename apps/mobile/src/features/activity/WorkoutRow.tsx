import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Workout, WorkoutType } from '../../../../../src/storage/types';
import { colors, space, touchMin, type } from '../../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { SoftGlyph } from '@/src/ui/IconTile';

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
    if (w.type === 'other') {
      const rest = w.notes.split(' · ').slice(1).join(' · ');
      if (rest) parts.push(rest);
    } else {
      parts.push(w.notes);
    }
  }
  return parts.join(' · ');
}

/** Soft list row — circular glyph + title + meta (ref 09). */
export function WorkoutRow({
  workout,
  onDelete,
}: {
  workout: Workout;
  onDelete: () => void;
}) {
  const meta = TYPE_META[workout.type];
  return (
    <AppCard padding="md" style={styles.card}>
      <View style={styles.row}>
        <SoftGlyph icon={meta.icon} />
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
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: type.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  delete: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
});
