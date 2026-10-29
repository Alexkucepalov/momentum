import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { buildHabitWeekMarks } from '../../../../src/domain/habitWeek';
import { HabitProgressBar } from '../features/habits/HabitProgressBar';
import { HabitWeekStrip } from '../features/habits/HabitWeekStrip';
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

/** Habits checklist for Today — food/water/activity live in their own blocks. */
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
        <View>
          <Text style={styles.subheading}>Мои привычки</Text>
          <Text style={styles.habitsLead}>Гибкая неделя · без штрафов</Text>
        </View>
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
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>
            Задай свои цели на неделю — например растяжка 3×. Пропуск дня ничего не ломает.
          </Text>
          {onManageHabits ? (
            <Pressable
              style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
              onPress={onManageHabits}
              accessibilityRole="button"
              accessibilityLabel="Добавить привычку"
            >
              <Ionicons name="add" size={16} color={colors.primaryButtonText} />
              <Text style={styles.emptyCtaText}>Добавить привычку</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        flexibleHabits.map((h) => (
          <Pressable
            key={h.id}
            style={({ pressed }) => [styles.habitCard, pressed && styles.pressed]}
            onPress={() => onToggleFlexible(h.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: h.loggedToday }}
            accessibilityLabel={`${h.name}, ${h.weekLabel}`}
          >
            <View style={styles.habitTop}>
              <View style={[styles.check, h.loggedToday && styles.checkOn]}>
                {h.loggedToday ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryButtonText} />
                ) : null}
              </View>
              <View style={styles.flexBody}>
                <Text style={[styles.label, h.loggedToday && styles.labelDone]}>{h.name}</Text>
                <Text style={styles.week}>{h.weekLabel}</Text>
              </View>
            </View>
            <HabitProgressBar completed={h.completed} target={h.target} />
            <HabitWeekStrip marks={h.marks} compact />
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
    padding: space.lg,
    marginBottom: space.lg,
  },
  habitsHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  subheading: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
  },
  habitsLead: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginTop: 2,
  },
  manageBtn: { minHeight: touchMin / 2, justifyContent: 'center' },
  manage: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  habitCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
    backgroundColor: colors.background,
  },
  habitTop: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.92, backgroundColor: colors.accentSoft },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  checkOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  flexBody: { flex: 1 },
  label: {
    flex: 1,
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
    marginTop: 2,
  },
  empty: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  emptyBody: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
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
