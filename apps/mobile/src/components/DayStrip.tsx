import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import { colors, radius, space, touchMin, type } from '../theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { dateChrome } from '@/src/ui/dateChrome';
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
    <AppCard
      padding="md"
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
            const isPast = iso < todayKey;
            const fill = fillByDate?.[iso] ?? 'empty';
            const hot = dragActive && hoverDate === iso;
            /** Ref 01: past=black, today=coral, future=gray; selected future → black. */
            const tone = hot
              ? 'selected'
              : isToday
                ? 'today'
                : isPast || on
                  ? 'past'
                  : 'future';
            return (
              <View
                key={iso}
                ref={(node) => {
                  chipRefs.current.set(iso, node);
                }}
                onLayout={() => measureDay(iso)}
                style={styles.chipWrap}
              >
                <Pressable
                  onPress={() => onSelect(iso)}
                  style={({ pressed }) => [
                    styles.chip,
                    tone === 'past' && styles.chipPast,
                    tone === 'today' && styles.chipToday,
                    tone === 'future' && styles.chipFuture,
                    tone === 'selected' && styles.chipOn,
                    dragActive && styles.chipDrag,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${WEEKDAY_SHORT_RU_CAP[i]} ${dayNumber(iso)}${isToday ? ', сегодня' : ''}${fill === 'filled' ? ', план полный' : fill === 'partial' ? ', план частичный' : ''}${hot ? ', цель переноса' : ''}`}
                >
                  <Text
                    style={[
                      styles.wd,
                      (tone === 'past' || tone === 'today' || tone === 'selected') && styles.onText,
                      tone === 'future' && styles.futureText,
                    ]}
                  >
                    {WEEKDAY_SHORT_RU_CAP[i]}
                  </Text>
                  <Text
                    style={[
                      styles.num,
                      (tone === 'past' || tone === 'today' || tone === 'selected') && styles.onText,
                      tone === 'future' && styles.futureText,
                    ]}
                  >
                    {dayNumber(iso)}
                  </Text>
                  {fillByDate ? (
                    <View
                      style={[
                        styles.dot,
                        fill === 'filled' && (on || hot ? styles.dotOnFilled : styles.dotFilled),
                        fill === 'partial' && (on || hot ? styles.dotOnPartial : styles.dotPartial),
                        fill === 'empty' && (on || hot ? styles.dotOnEmpty : styles.dotEmpty),
                      ]}
                    />
                  ) : null}
                </Pressable>
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
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.md,
  },
  wrapDrag: {
    backgroundColor: colors.focusSoft,
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
  chipWrap: { flex: 1 },
  chip: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
    minHeight: dateChrome.chipMin,
  },
  chipPast: {
    backgroundColor: colors.primaryButton,
  },
  chipOn: {
    backgroundColor: colors.primaryButton,
    transform: [{ scale: 1.04 }],
  },
  chipToday: {
    backgroundColor: colors.focus,
  },
  chipFuture: {
    backgroundColor: colors.accentSoft,
  },
  chipDrag: {
    minHeight: 52,
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
  futureText: {
    color: colors.textMuted,
  },
  dot: {
    marginTop: 3,
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
    marginTop: 4,
    textAlign: 'center',
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
