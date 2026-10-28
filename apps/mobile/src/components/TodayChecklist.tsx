import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { buildHabitWeekMarks } from '../../../../src/domain/habitWeek';
import { HabitProgressBar } from '../features/habits/HabitProgressBar';
import { colors, radius, space, touchMin, type } from '../theme/tokens';

export type FlexibleHabitRow = {
  id: string;
  name: string;
  loggedToday: boolean;
  weekLabel: string;
  completed: number;
  target: number;
  marks: ReturnType<typeof buildHabitWeekMarks>;
};

/** Optional full habits card — Today prefers compact inline list. */
export function TodayChecklist({
  flexibleHabits,
  onToggleFlexible,
  onManageHabits,
}: {
  flexibleHabits: FlexibleHabitRow[];
  onToggleFlexible: (habitId: string) => void;
  onManageHabits?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.habitsHead}>
        <Text style={styles.subheading}>Привычки</Text>
        {onManageHabits ? (
          <Pressable
            onPress={onManageHabits}
            accessibilityRole="button"
            accessibilityLabel="Управлять привычками"
            hitSlop={8}
            style={styles.manageBtn}
          >
            <Text style={styles.manage}>Настроить</Text>
          </Pressable>
        ) : null}
      </View>

      {flexibleHabits.length === 0 ? (
        onManageHabits ? (
          <Pressable
            style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            onPress={onManageHabits}
            accessibilityRole="button"
            accessibilityLabel="Добавить привычку"
          >
            <Ionicons name="add" size={16} color={colors.primaryButtonText} />
            <Text style={styles.emptyCtaText}>Добавить</Text>
          </Pressable>
        ) : null
      ) : (
        flexibleHabits.map((h, i) => (
          <Pressable
            key={h.id}
            style={({ pressed }) => [
              styles.habitRow,
              i > 0 && styles.habitRowBorder,
              pressed && styles.pressed,
            ]}
            onPress={() => onToggleFlexible(h.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: h.loggedToday }}
            accessibilityLabel={`${h.name}, ${h.weekLabel}`}
          >
            <View style={[styles.check, h.loggedToday && styles.checkOn]}>
              {h.loggedToday ? (
                <Ionicons name="checkmark" size={14} color={colors.primaryButtonText} />
              ) : null}
            </View>
            <View style={styles.flexBody}>
              <Text style={[styles.label, h.loggedToday && styles.labelDone]}>{h.name}</Text>
              <Text style={styles.week}>{h.weekLabel}</Text>
              <HabitProgressBar completed={h.completed} target={h.target} />
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
  },
  habitsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  subheading: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  manageBtn: { minHeight: touchMin / 2, justifyContent: 'center' },
  manage: { fontSize: type.caption, fontWeight: '700', color: colors.textMuted },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: space.sm,
    minHeight: touchMin,
  },
  habitRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.88 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
    marginTop: 2,
  },
  checkOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  flexBody: { flex: 1, gap: 4 },
  label: {
    fontSize: type.body,
    color: colors.text,
    fontWeight: '600',
  },
  labelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  week: {
    fontSize: type.micro,
    color: colors.textMuted,
  },
  emptyCta: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  emptyCtaText: { fontWeight: '700', color: colors.primaryButtonText, fontSize: type.caption },
});
