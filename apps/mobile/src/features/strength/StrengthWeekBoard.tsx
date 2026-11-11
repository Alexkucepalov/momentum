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
  onSelectDate,
  onAdd,
  onMenu,
  onStart,
}: {
  days: StrengthWeekDay[];
  selectedDate: string;
  onSelectDate: (dateLocal: string) => void;
  onAdd: () => void;
  onMenu: (activity: PlannedActivity) => void;
  onStart: (activity: PlannedActivity) => void;
}) {
  const selected = days.find((d) => d.dateLocal === selectedDate) ?? days[0];
  const cards = selected?.activities ?? [];

  return (
    <View style={styles.wrap} testID="strength-week-board">
      <View style={styles.head}>
        <AppText variant="label" tone="muted">
          План недели
        </AppText>
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

      <View style={styles.chips} accessibilityRole="tablist">
        {days.map((d) => {
          const selectedChip = d.dateLocal === selectedDate;
          const short = HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]?.slice(0, 2) ?? '·';
          const dayNum = Number(d.dateLocal.slice(8, 10));
          return (
            <Pressable
              key={d.dateLocal}
              onPress={() => onSelectDate(d.dateLocal)}
              style={({ pressed }) => [
                styles.chip,
                selectedChip && styles.chipOn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedChip }}
              accessibilityLabel={`${HABIT_WEEKDAY_LABELS_RU[d.weekdayIndex]}, ${dayNum}, ${d.activities.length} в плане`}
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
          <AppText variant="caption" tone="muted" style={styles.empty}>
            Пустой день — не «ноль». Добавь шаблон или отдых.
          </AppText>
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
  chipDow: {
    textTransform: 'lowercase',
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
  empty: {
    paddingVertical: space.sm,
  },
  pressed: { opacity: 0.85 },
});
