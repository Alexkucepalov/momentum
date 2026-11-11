import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import type { StrengthWeekDay } from '../../../../../src/domain/strength/weekBoard';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { PlannedActivityCard } from './PlannedActivityCard';

export function StrengthWeekBoard({
  days,
  selectedDate,
  todayDate,
  onSelectDate,
  onAdd,
  onApplyProgram,
  onMenu,
  onStart,
}: {
  days: StrengthWeekDay[];
  selectedDate: string;
  /** Local today key — chip outline for orientation. */
  todayDate?: string;
  onSelectDate: (dateLocal: string) => void;
  onAdd: () => void;
  /** Fill / replace week from personal program (4 strength + bike + 2 rest). */
  onApplyProgram?: () => void;
  onMenu: (activity: PlannedActivity) => void;
  onStart: (activity: PlannedActivity) => void;
}) {
  const selected = days.find((d) => d.dateLocal === selectedDate) ?? days[0];
  const cards = selected?.activities ?? [];
  const plannedCount = days.reduce((n, d) => n + d.activities.length, 0);

  return (
    <View style={styles.wrap} testID="strength-week-board">
      <View style={styles.head}>
        <AppText variant="label" tone="muted">
          План недели
        </AppText>
        <View style={styles.headActions}>
          {onApplyProgram ? (
            <Pressable
              onPress={onApplyProgram}
              style={({ pressed }) => [styles.programBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={
                plannedCount > 0
                  ? 'Повторить программу на эту неделю'
                  : 'Заполнить неделю программой'
              }
              testID="strength-week-apply-program"
            >
              <AppText variant="caption" tone="secondary">
                {plannedCount > 0 ? 'Повторить программу' : 'Программа'}
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Добавить в план дня"
            testID="strength-week-add"
          >
            <Ionicons name="add" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.chips} accessibilityRole="tablist">
        {days.map((d) => {
          const selectedChip = d.dateLocal === selectedDate;
          const isToday = todayDate != null && d.dateLocal === todayDate;
          const short = HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]?.slice(0, 2) ?? '·';
          const dayNum = Number(d.dateLocal.slice(8, 10));
          return (
            <Pressable
              key={d.dateLocal}
              onPress={() => onSelectDate(d.dateLocal)}
              style={({ pressed }) => [
                styles.chip,
                selectedChip && styles.chipOn,
                isToday && !selectedChip && styles.chipToday,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedChip }}
              accessibilityLabel={`${HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]}, ${dayNum}, ${d.activities.length} в плане${isToday ? ', сегодня' : ''}`}
            >
              <AppText
                variant="caption"
                tone={selectedChip ? 'inverse' : 'muted'}
                style={styles.chipDow}
              >
                {short}
              </AppText>
              <AppText variant="body" tone={selectedChip ? 'inverse' : 'ink'}>
                {dayNum}
              </AppText>
              {d.activities.length > 0 ? (
                <View style={[styles.dot, selectedChip && styles.dotOn]} />
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.cards}>
        {cards.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppText variant="body" tone="muted">
              День свободен
            </AppText>
            <AppText variant="caption" tone="muted">
              Не «ноль» — просто нет плана. «+» или Программа на неделю.
            </AppText>
          </View>
        ) : (
          cards.map((a) => (
            <PlannedActivityCard
              key={a.id}
              activity={a}
              onMenu={() => onMenu(a)}
              onStart={a.kind === 'strength' ? () => onStart(a) : undefined}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    marginBottom: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  programBtn: {
    minHeight: touchMin - 8,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  addBtn: {
    minWidth: touchMin - 8,
    minHeight: touchMin - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chips: {
    flexDirection: 'row',
    gap: space.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 2,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipToday: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  chipDow: {
    textTransform: 'lowercase',
  },
  emptyBox: {
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink,
    marginTop: 2,
  },
  dotOn: {
    backgroundColor: colors.onPrimary,
  },
  dotSpacer: {
    height: 6,
  },
  cards: {
    gap: space.sm,
  },
  pressed: { opacity: 0.85 },
});
