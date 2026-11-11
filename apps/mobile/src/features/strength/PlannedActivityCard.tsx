import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

export function PlannedActivityCard({
  activity,
  onMenu,
  onStart,
}: {
  activity: PlannedActivity;
  onMenu: () => void;
  onStart?: () => void;
}) {
  const kindLabel =
    activity.kind === 'strength' ? 'Сила' : activity.kind === 'cardio' ? 'Кардио' : 'Отдых';
  const canStart = activity.kind === 'strength' && onStart;

  return (
    <View
      style={[styles.card, activity.kind === 'rest' && styles.cardRest]}
      testID={`planned-activity-${activity.id}`}
    >
      <View
        style={[
          styles.kindBar,
          activity.kind === 'strength' && styles.barStrength,
          activity.kind === 'cardio' && styles.barCardio,
          activity.kind === 'rest' && styles.barRest,
        ]}
      />
      <View style={styles.body}>
        <View style={styles.main}>
          <AppText variant="caption" tone="muted">
            {kindLabel}
            {activity.timeLocal ? ` · ${activity.timeLocal}` : ''}
          </AppText>
          <AppText variant="subtitle">{activity.title}</AppText>
          {activity.subtitle ? (
            <AppText variant="caption" tone="secondary" numberOfLines={2}>
              {activity.subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.actions}>
          {canStart ? (
            <Pressable
              onPress={onStart}
              style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Начать ${activity.title}`}
              testID={`planned-start-${activity.id}`}
            >
              <Ionicons name="play" size={16} color={colors.onPrimary} />
              <AppText variant="caption" tone="inverse" style={styles.startLabel}>
                Начать
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onMenu}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Меню ${activity.title}`}
            testID={`planned-menu-${activity.id}`}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardRest: {
    opacity: 0.92,
  },
  kindBar: {
    width: 4,
    backgroundColor: colors.borderStrong,
  },
  barStrength: { backgroundColor: colors.ink },
  barCardio: { backgroundColor: colors.textSecondary },
  barRest: { backgroundColor: colors.border },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: touchMin - 4,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  startLabel: { fontWeight: '700' },
  iconBtn: {
    minWidth: touchMin - 8,
    minHeight: touchMin - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
  },
  pressed: { opacity: 0.85 },
});
