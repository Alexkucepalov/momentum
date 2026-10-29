import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import { colors, radius, space, touchMin, type } from '../theme/tokens';
import { dayNumber, formatWeekRangeRu, WEEKDAY_SHORT_RU_CAP } from './weekFormat';

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/**
 * Calendar week Mon→Sun for the week that contains `selected`.
 * Compact horizontal strip — no bulky card header / «Календарь» label.
 */
export function DayStrip({
  selected,
  today,
  onSelect,
  onOpenCalendar,
}: {
  selected: string;
  today?: string;
  onSelect: (dateLocal: string) => void;
  onOpenCalendar?: () => void;
}) {
  const weekStart = weekStartMonday(selected);
  const days = datesInWeekFromStart(weekStart);
  const weekEnd = days[6] ?? weekStart;
  const todayKey = today ?? selected;

  const shiftWeek = (deltaWeeks: number) => {
    onSelect(addDays(weekStart, deltaWeeks * 7));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.controls}>
        <Pressable
          onPress={() => shiftWeek(-1)}
          style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Предыдущая неделя"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </Pressable>

        <View style={styles.row} accessibilityRole="tablist">
          {days.map((iso, i) => {
            const on = iso === selected;
            const isToday = iso === todayKey;
            return (
              <Pressable
                key={iso}
                onPress={() => onSelect(iso)}
                style={({ pressed }) => [
                  styles.chip,
                  on && styles.chipOn,
                  isToday && !on && styles.chipToday,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[i]} ${dayNumber(iso)}${isToday ? ', сегодня' : ''}`}
              >
                <Text style={[styles.wd, on && styles.onText]}>{WEEKDAY_SHORT_RU_CAP[i]}</Text>
                <Text style={[styles.num, on && styles.onText]}>{dayNumber(iso)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => shiftWeek(1)}
          style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Следующая неделя"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Pressable>

        {onOpenCalendar ? (
          <Pressable
            onPress={onOpenCalendar}
            style={({ pressed }) => [styles.calBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Открыть календарь"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.range} accessibilityLabel={`Неделя ${formatWeekRangeRu(weekStart, weekEnd)}`}>
        {formatWeekRangeRu(weekStart, weekEnd)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBtn: {
    width: 28,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calBtn: {
    width: touchMin,
    height: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  chipOn: {
    backgroundColor: colors.primaryButton,
  },
  chipToday: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  wd: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
  },
  num: {
    marginTop: 1,
    fontSize: type.body,
    fontWeight: '800',
    color: colors.text,
  },
  onText: {
    color: colors.primaryButtonText,
  },
  range: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
