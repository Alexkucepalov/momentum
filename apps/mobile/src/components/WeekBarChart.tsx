import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import { colors, radius, space, type } from '../theme/tokens';
import { dayNumber, WEEKDAY_SHORT_RU_CAP } from './weekFormat';

export type WeekBarDay = {
  dateLocal: string;
  /** Bar magnitude; 0 = empty stub. */
  value: number;
  /** Caption under the bar (kcal, minutes…). */
  valueLabel: string;
  /** Monday=0 .. Sunday=6 */
  weekdayIndex: number;
};

/**
 * Shared Mon–Sun week chart used on Food / Progress / Activity.
 * Selected day is framed; empty days stay muted — no “good/bad” colors.
 */
export function WeekBarChart({
  title,
  subtitle,
  days,
  selectedDate,
  todayDate,
  onSelectDate,
  footnote,
  maxValue,
}: {
  title: string;
  subtitle?: string;
  days: WeekBarDay[];
  selectedDate: string;
  todayDate?: string;
  onSelectDate?: (dateLocal: string) => void;
  footnote?: string;
  /** Override bar scale; defaults to max of day values. */
  maxValue?: number;
}) {
  const scale = Math.max(maxValue ?? 0, ...days.map((d) => d.value), 1);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.row}>
        {days.map((d) => {
          const selected = d.dateLocal === selectedDate;
          const isToday = todayDate != null && d.dateLocal === todayDate;
          const empty = d.value <= 0;
          const h = empty ? 6 : Math.max(10, Math.round((d.value / scale) * 52));
          return (
            <Pressable
              key={d.dateLocal}
              style={({ pressed }) => [
                styles.col,
                selected && styles.colSelected,
                pressed && onSelectDate && styles.pressed,
              ]}
              onPress={onSelectDate ? () => onSelectDate(d.dateLocal) : undefined}
              disabled={!onSelectDate}
              accessibilityRole={onSelectDate ? 'button' : 'text'}
              accessibilityState={{ selected }}
              accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[d.weekdayIndex]} ${dayNumber(d.dateLocal)}, ${d.valueLabel}${isToday ? ', сегодня' : ''}`}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: h },
                    empty && styles.barEmpty,
                    selected && !empty && styles.barSelected,
                  ]}
                />
              </View>
              <Text style={[styles.wd, selected && styles.wdOn]}>
                {WEEKDAY_SHORT_RU_CAP[d.weekdayIndex]}
              </Text>
              <Text style={[styles.dayNum, selected && styles.dayNumOn]}>{dayNumber(d.dateLocal)}</Text>
              <Text style={[styles.value, empty && styles.valueEmpty]} numberOfLines={1}>
                {d.valueLabel}
              </Text>
              {isToday ? <View style={[styles.todayDot, selected && styles.todayDotOn]} /> : <View style={styles.todaySpacer} />}
            </Pressable>
          );
        })}
      </View>

      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
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
  head: {
    marginBottom: space.md,
  },
  headText: { gap: 2 },
  title: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 4 },
  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.xs,
    borderRadius: radius.md,
  },
  colSelected: {
    backgroundColor: colors.accentSoft,
  },
  pressed: { opacity: 0.88 },
  barTrack: {
    height: 56,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  barFill: {
    width: '72%',
    maxWidth: 26,
    borderRadius: 5,
    backgroundColor: colors.textSecondary,
    minHeight: 6,
  },
  barEmpty: {
    backgroundColor: colors.border,
  },
  barSelected: {
    backgroundColor: colors.text,
  },
  wd: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
  },
  wdOn: { color: colors.text },
  dayNum: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
  },
  dayNumOn: { color: colors.text },
  value: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  valueEmpty: { color: colors.textMuted },
  todayDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  todayDotOn: { backgroundColor: colors.text },
  todaySpacer: { marginTop: 4, height: 5 },
  footnote: {
    marginTop: space.md,
    fontSize: type.micro,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
