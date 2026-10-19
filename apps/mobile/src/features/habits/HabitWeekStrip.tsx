import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { HabitWeekDayMark } from '../../../../../src/domain/habitWeek';
import { dayNumber } from '../../components/weekFormat';
import { colors, radius, space, type } from '../../theme/tokens';

export function HabitWeekStrip({
  marks,
  compact = false,
}: {
  marks: HabitWeekDayMark[];
  compact?: boolean;
}) {
  return (
    <View
      style={[styles.row, compact && styles.rowCompact]}
      accessibilityRole="summary"
      accessibilityLabel={marks
        .map((m) => `${m.label}${m.logged ? ' отмечен' : ''}${m.isToday ? ' сегодня' : ''}`)
        .join(', ')}
    >
      {marks.map((m) => (
        <View key={m.dateLocal} style={styles.cell}>
          <Text style={[styles.label, m.isToday && styles.labelToday]}>{m.label}</Text>
          {!compact ? (
            <Text style={[styles.dayNum, m.isToday && styles.labelToday]}>{dayNumber(m.dateLocal)}</Text>
          ) : null}
          <View
            style={[
              compact ? styles.markSm : styles.mark,
              m.logged && styles.markOn,
              m.isToday && !m.logged && styles.markToday,
            ]}
          >
            {m.logged ? (
              <Ionicons
                name="checkmark"
                size={compact ? 8 : 12}
                color={colors.primaryButtonText}
              />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.xs,
    marginTop: space.sm,
  },
  rowCompact: {
    marginTop: space.sm,
  },
  cell: { alignItems: 'center', flex: 1 },
  label: {
    fontSize: type.micro,
    color: colors.textMuted,
    marginBottom: 2,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  labelToday: { color: colors.text },
  mark: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSm: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  markOn: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  markToday: {
    borderColor: colors.text,
  },
});
