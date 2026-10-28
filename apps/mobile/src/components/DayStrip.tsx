import { useEffect, useRef } from 'react';
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
 * Nutrition etalon week row (ref 07): weekday above a gray circle.
 * Selected day is the only black circle, with a short tick under it.
 * Today, when it is not the selected day, is a coral ring — not a filled past-day.
 */
export type DayStripFill = 'empty' | 'partial' | 'filled';

export type DayStripBox = { x: number; y: number; width: number; height: number };

export function DayStrip({
  selected,
  today,
  onSelect,
  onOpenCalendar,
  fillByDate,
  dragActive,
  hoverDate,
  onDayBox,
}: {
  selected: string;
  today?: string;
  onSelect: (dateLocal: string) => void;
  onOpenCalendar?: () => void;
  /** Optional plan-fill dots under day numbers. */
  fillByDate?: Record<string, DayStripFill>;
  /** Enlarge hit targets while dragging a planned meal. */
  dragActive?: boolean;
  hoverDate?: string | null;
  onDayBox?: (dateLocal: string, box: DayStripBox | null) => void;
}) {
  const weekStart = weekStartMonday(selected);
  const days = datesInWeekFromStart(weekStart);
  const weekEnd = days[6] ?? weekStart;
  const todayKey = today ?? selected;
  const chipRefs = useRef<Map<string, View | null>>(new Map());

  const shiftWeek = (deltaWeeks: number) => {
    onSelect(addDays(weekStart, deltaWeeks * 7));
  };

  const measureDay = (iso: string) => {
    const node = chipRefs.current.get(iso);
    if (!node || !onDayBox) return;
    node.measureInWindow((x, y, width, height) => {
      onDayBox(iso, { x, y, width, height });
    });
  };

  useEffect(() => {
    if (!onDayBox) return;
    for (const iso of days) measureDay(iso);
    return () => {
      for (const iso of days) onDayBox(iso, null);
    };
  }, [days.join('|'), dragActive, onDayBox]);

  return (
    <View
      style={[styles.wrap, dragActive && styles.wrapDrag]}
      accessibilityRole="summary"
    >
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
            const fill = fillByDate?.[iso] ?? 'empty';
            const hot = dragActive && hoverDate === iso;
            const selectedTone = on || hot;
            return (
              <View
                key={iso}
                ref={(node) => {
                  chipRefs.current.set(iso, node);
                }}
                onLayout={() => measureDay(iso)}
                style={styles.chipWrap}
              >
                <Text style={styles.wd}>{WEEKDAY_SHORT_RU_CAP[i]}</Text>
                <Pressable
                  onPress={() => onSelect(iso)}
                  style={({ pressed }) => [
                    styles.circle,
                    selectedTone && styles.circleOn,
                    !selectedTone && isToday && styles.circleToday,
                    dragActive && styles.circleDrag,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[i]} ${dayNumber(iso)}${isToday ? ', сегодня' : ''}${fill === 'filled' ? ', план полный' : fill === 'partial' ? ', план частичный' : ''}${hot ? ', цель переноса' : ''}`}
                >
                  <Text style={[styles.num, selectedTone && styles.numOn]}>{dayNumber(iso)}</Text>
                </Pressable>
                <View style={[styles.tick, selectedTone && styles.tickOn]} />
                {fillByDate ? (
                  <View
                    style={[
                      styles.dot,
                      fill === 'filled' && (selectedTone ? styles.dotOnFilled : styles.dotFilled),
                      fill === 'partial' && (selectedTone ? styles.dotOnPartial : styles.dotPartial),
                      fill === 'empty' && (selectedTone ? styles.dotOnEmpty : styles.dotEmpty),
                    ]}
                  />
                ) : null}
              </View>
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

const CIRCLE = 34;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
  },
  wrapDrag: {
    backgroundColor: colors.focusSoft,
    borderRadius: radius.lg,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  navBtn: {
    width: 28,
    height: touchMin,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calBtn: {
    width: 36,
    height: touchMin,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  chipWrap: { flex: 1, alignItems: 'center' },
  wd: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  circleOn: {
    backgroundColor: colors.primaryButton,
  },
  circleToday: {
    backgroundColor: colors.focusSoft,
    borderWidth: 1.5,
    borderColor: colors.focus,
  },
  circleDrag: {
    minWidth: 40,
    minHeight: 40,
  },
  pressed: { opacity: 0.85 },
  num: {
    fontSize: type.caption,
    fontWeight: '800',
    color: colors.text,
  },
  numOn: {
    color: colors.primaryButtonText,
  },
  tick: {
    marginTop: 4,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tickOn: {
    backgroundColor: colors.primaryButton,
  },
  dot: {
    marginTop: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotEmpty: { backgroundColor: colors.border },
  dotPartial: { backgroundColor: colors.warning },
  dotFilled: { backgroundColor: colors.success },
  dotOnEmpty: { backgroundColor: colors.chipOnInverse },
  dotOnPartial: { backgroundColor: colors.warning },
  dotOnFilled: { backgroundColor: colors.successSoft },
  range: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
