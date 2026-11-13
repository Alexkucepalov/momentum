import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import { AppText, colors, radius, space, touchMin } from '../design-system';
import { dayNumber, formatWeekRangeRu, WEEKDAY_SHORT_RU_CAP } from './weekFormat';

export function DayStrip({ selected, today, onSelect, onOpenCalendar }: {
  selected: string; today?: string; onSelect: (date: string) => void; onOpenCalendar?: () => void;
}) {
  const start = weekStartMonday(selected);
  const days = datesInWeekFromStart(start);
  const shift = (n: number) => {
    const dt = new Date(`${start}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + n * 7);
    onSelect(dt.toISOString().slice(0, 10));
  };
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="caption" tone="secondary" style={styles.range}>{formatWeekRangeRu(start, days[6] ?? start)}</AppText>
        <View style={styles.controls}>
          <Pressable onPress={() => shift(-1)} style={styles.control} accessibilityRole="button" accessibilityLabel="Предыдущая неделя"><Ionicons name="chevron-back" size={16} color={colors.ink} /></Pressable>
          <Pressable onPress={() => shift(1)} style={styles.control} accessibilityRole="button" accessibilityLabel="Следующая неделя"><Ionicons name="chevron-forward" size={16} color={colors.ink} /></Pressable>
          {onOpenCalendar ? <Pressable onPress={onOpenCalendar} style={styles.control} accessibilityRole="button" accessibilityLabel="Открыть календарь"><Ionicons name="calendar-outline" size={18} color={colors.ink} /></Pressable> : null}
        </View>
      </View>
      <View style={styles.days} accessibilityRole="tablist" accessibilityLabel="Дни недели">
        {days.map((date, i) => {
          const active = date === selected;
          return (
            <Pressable key={date} onPress={() => onSelect(date)} style={({ pressed }) => [styles.day, active && styles.active, pressed && styles.pressed]} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[i]} ${dayNumber(date)}${date === today ? ', сегодня' : ''}`}>
              <AppText variant="label" tone={active ? 'inverse' : 'muted'}>{WEEKDAY_SHORT_RU_CAP[i]}</AppText>
              <AppText variant="body" tone={active ? 'inverse' : 'ink'} style={styles.number}>{dayNumber(date)}</AppText>
              <View style={[styles.dot, { opacity: date === today ? 1 : 0, backgroundColor: active ? colors.onPrimary : colors.sageInk }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: space.sm }, head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  range: { flex: 1 }, controls: { flexDirection: 'row' }, control: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', marginHorizontal: -space.sm }, day: { flex: 1, minWidth: 0, minHeight: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: space.sm },
  active: { backgroundColor: colors.ink }, number: { fontWeight: '600' }, dot: { width: 3, height: 3, borderRadius: 2 }, pressed: { opacity: 0.75 },
});
