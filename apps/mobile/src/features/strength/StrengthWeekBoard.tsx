import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import type { StrengthWeekDay } from '../../../../../src/domain/strength/weekBoard';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { PlannedActivityCard } from './PlannedActivityCard';

/**
 * Full-week training board (ChatGPT / Entraînements IA):
 * day chips jump focus; all days listed with cards — not only selected day.
 */
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
  todayDate?: string;
  onSelectDate: (dateLocal: string) => void;
  onAdd: () => void;
  onApplyProgram?: () => void;
  onMenu: (activity: PlannedActivity) => void;
  onStart: (activity: PlannedActivity) => void;
}) {
  const plannedCount = days.reduce((n, d) => n + d.activities.length, 0);

  return (
    <View style={styles.wrap} testID="strength-week-board">
      <View style={styles.head}>
        <View>
          <AppText variant="subtitle" style={styles.headTitle}>
            Неделя
          </AppText>
          <AppText variant="caption" tone="muted">
            {plannedCount > 0 ? `${plannedCount} в плане` : 'План ещё пуст'}
          </AppText>
        </View>
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
              <AppText variant="caption" style={styles.programLabel}>
                {plannedCount > 0 ? 'Повторить' : 'Программа'}
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
            <Ionicons name="add" size={22} color={colors.onPrimary} />
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
              <AppText
                variant="body"
                tone={selectedChip ? 'inverse' : 'ink'}
                style={styles.chipNum}
              >
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

      <View style={styles.days} testID="strength-week-all-days">
        {days.map((d) => {
          const isSelected = d.dateLocal === selectedDate;
          const isToday = todayDate != null && d.dateLocal === todayDate;
          const dow = HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex] ?? '';
          const dayNum = Number(d.dateLocal.slice(8, 10));
          return (
            <View
              key={d.dateLocal}
              style={[styles.dayBlock, isSelected && styles.dayBlockOn]}
              testID={`week-day-${d.dateLocal}`}
            >
              <Pressable
                onPress={() => onSelectDate(d.dateLocal)}
                style={styles.dayHead}
                accessibilityRole="button"
                accessibilityLabel={`${dow} ${dayNum}`}
              >
                <AppText variant="body" style={styles.dayTitle}>
                  {dow} {dayNum}
                  {isToday ? ' · сегодня' : ''}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {d.activities.length === 0
                    ? 'свободно'
                    : `${d.activities.length} ${d.activities.length === 1 ? 'занятие' : 'занятия'}`}
                </AppText>
              </Pressable>

              {d.activities.length === 0 ? (
                isSelected ? (
                  <Pressable
                    onPress={onAdd}
                    style={({ pressed }) => [styles.emptyAdd, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Добавить в этот день"
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.textMuted} />
                    <AppText variant="caption" tone="muted">
                      Добавить силу / кардио / отдых
                    </AppText>
                  </Pressable>
                ) : null
              ) : (
                <View style={styles.cards}>
                  {d.activities.map((a) => (
                    <PlannedActivityCard
                      key={a.id}
                      activity={a}
                      onMenu={() => onMenu(a)}
                      onStart={a.kind === 'strength' ? () => onStart(a) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headTitle: { fontWeight: '800' },
  headActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  programBtn: {
    minHeight: touchMin - 8,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  programLabel: { fontWeight: '700' },
  addBtn: {
    minWidth: touchMin - 4,
    minHeight: touchMin - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    gap: space.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.lg,
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
  chipNum: { fontWeight: '700' },
  days: { gap: space.md },
  dayBlock: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  dayBlockOn: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
    minHeight: touchMin - 16,
  },
  dayTitle: { fontWeight: '700' },
  cards: { gap: space.sm },
  emptyAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: touchMin - 8,
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
  pressed: { opacity: 0.85 },
});
