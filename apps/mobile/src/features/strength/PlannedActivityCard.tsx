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

  return (
    <View style={styles.card} testID={`planned-activity-${activity.id}`}>
      <View style={styles.main}>
        <AppText variant="caption" tone="muted">
          {kindLabel}
          {activity.timeLocal ? ` · ${activity.timeLocal}` : ''}
        </AppText>
        <AppText variant="body">{activity.title}</AppText>
        {activity.subtitle ? (
          <AppText variant="caption" tone="secondary">
            {activity.subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.actions}>
        {activity.kind === 'strength' && onStart ? (
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Начать ${activity.title}`}
            testID={`planned-start-${activity.id}`}
          >
            <Ionicons name="play" size={18} color={colors.ink} />
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
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: space.xs,
  },
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
