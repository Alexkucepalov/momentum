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
  const metaBits = [
    kindLabel,
    activity.timeLocal,
    activity.cardioMinutes != null ? `${activity.cardioMinutes} мин` : null,
  ].filter(Boolean);

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
          <AppText variant="caption" tone="muted" style={styles.meta}>
            {metaBits.join(' · ')}
          </AppText>
          <AppText variant="subtitle" style={styles.title}>
            {activity.title}
          </AppText>
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
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: touchMin + 8,
  },
  cardRest: {
    opacity: 0.92,
  },
  kindBar: {
    width: 4,
    backgroundColor: colors.borderStrong,
  },
  barStrength: { backgroundColor: colors.accent },
  barCardio: { backgroundColor: colors.mealDinner },
  barRest: { backgroundColor: colors.border },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  meta: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  title: { fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  startBtn: {
    minHeight: touchMin,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  startLabel: { fontWeight: '700' },
  iconBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
  },
  pressed: { opacity: 0.85 },
});
