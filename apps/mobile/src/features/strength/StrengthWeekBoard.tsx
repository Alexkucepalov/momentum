import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HABIT_WEEKDAY_LABELS_RU } from '../../../../../src/domain/habitWeek';
import type { PlannedActivity } from '../../../../../src/domain/strength/types';
import type { StrengthWeekDay } from '../../../../../src/domain/strength/weekBoard';
import { AppButton, AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { PlannedActivityCard } from './PlannedActivityCard';

/**
 * Selected-day plan only. Date navigation lives in DayStrip above.
 */
export function StrengthWeekBoard({
  days,
  selectedDate,
  todayDate,
  onAdd,
  onApplyProgram,
  onOpenTemplates,
  onMenu,
  onStart,
}: {
  days: StrengthWeekDay[];
  selectedDate: string;
  todayDate?: string;
  /** Kept for callers that still pass chips handler; unused in day-focus UI. */
  onSelectDate?: (dateLocal: string) => void;
  onAdd: () => void;
  onApplyProgram?: () => void;
  onOpenTemplates?: () => void;
  onMenu: (activity: PlannedActivity) => void;
  onStart: (activity: PlannedActivity) => void;
}) {
  const selected = days.find((d) => d.dateLocal === selectedDate) ?? days[0];
  const cards = selected?.activities ?? [];
  const plannedCount = days.reduce((n, d) => n + d.activities.length, 0);
  const dow =
    selected != null ? HABIT_WEEKDAY_LABELS_RU[selected.weekdayIndex] ?? '' : '';
  const dayNum = selected ? Number(selected.dateLocal.slice(8, 10)) : '';
  const isToday = todayDate != null && selectedDate === todayDate;

  return (
    <View style={styles.wrap} testID="strength-week-board">
      <View style={styles.dayHead}>
        <View style={styles.dayHeadText}>
          <AppText variant="subtitle" style={styles.dayTitle}>
            {isToday ? 'Сегодня' : `${dow} ${dayNum}`}
          </AppText>
          <AppText variant="caption" tone="muted">
            {cards.length === 0
              ? 'План дня'
              : `${cards.length} ${cards.length === 1 ? 'занятие' : 'в плане'}`}
          </AppText>
        </View>
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Добавить в план"
          testID="strength-week-add"
        >
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {cards.length === 0 ? (
        <View style={styles.empty} testID="strength-day-empty">
          <AppText variant="body">Что делаем в этот день?</AppText>
          <AppText variant="caption" tone="muted">
            Сила из шаблона, кардио или отдых — потом жми «Начать» на карточке.
          </AppText>
          <AppButton label="Добавить в план" onPress={onAdd} testID="strength-day-add-cta" />
          {onApplyProgram ? (
            <AppButton
              label={plannedCount > 0 ? 'Повторить программу' : 'Заполнить неделю'}
              variant="secondary"
              onPress={onApplyProgram}
              testID="strength-day-program-cta"
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.cards}>
          {cards.map((a) => (
            <PlannedActivityCard
              key={a.id}
              activity={a}
              onMenu={() => onMenu(a)}
              onStart={a.kind === 'strength' ? () => onStart(a) : undefined}
            />
          ))}
        </View>
      )}

      <View style={styles.footerLinks}>
        {onApplyProgram && plannedCount > 0 && cards.length > 0 ? (
          <Pressable
            onPress={onApplyProgram}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            accessibilityRole="button"
            testID="strength-week-apply-program"
          >
            <AppText variant="caption" tone="secondary">
              Повторить программу
            </AppText>
          </Pressable>
        ) : null}
        {onOpenTemplates ? (
          <Pressable
            onPress={onOpenTemplates}
            style={({ pressed }) => [styles.templatesRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Шаблоны и редактор"
            testID="strength-open-templates"
          >
            <Ionicons name="barbell-outline" size={18} color={colors.ink} />
            <AppText variant="body" style={styles.templatesLabel}>
              Шаблоны
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  dayHeadText: { flex: 1, gap: 2 },
  dayTitle: { fontWeight: '800' },
  addBtn: {
    minWidth: touchMin - 4,
    minHeight: touchMin - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  empty: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cards: { gap: space.sm },
  footerLinks: { gap: space.sm },
  linkRow: {
    minHeight: touchMin - 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  templatesLabel: { flex: 1, fontWeight: '600' },
  pressed: { opacity: 0.85 },
});
