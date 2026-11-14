import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatWeekRangeRu } from '@/src/components/weekFormat';

import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

export type WeekDayOption = {
  dateLocal: string;
  label: string;
};

export function MoveCopyActivitySheet({
  visible,
  mode,
  activityTitle,
  days,
  onClose,
  onPick,
}: {
  visible: boolean;
  mode: 'move' | 'copy';
  activityTitle: string;
  days: WeekDayOption[];
  onClose: () => void;
  onPick: (dateLocal: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const start = days[0]?.dateLocal;
  useEffect(() => { if (visible) setOffset(0); }, [visible, start]);
  const displayed = useMemo(() => days.map(day => {
    const d = new Date(`${day.dateLocal}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset * 7);
    return { dateLocal: d.toISOString().slice(0, 10), label: d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) };
  }), [days, offset]);
  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.7}
      testID="move-copy-activity-sheet"
    >
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          {mode === 'move' ? 'Куда перенести' : 'Куда копировать'}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sub}>
          {activityTitle}
          {mode === 'move'
            ? ' · факт тренировки не меняется'
            : ' · исходная карточка останется'}
        </AppText>
        <View style={styles.weekNav}>
          <Pressable style={styles.navButton} accessibilityRole="button" accessibilityLabel="Предыдущая неделя для переноса" onPress={() => setOffset(v => v - 1)}><Ionicons name="chevron-back" size={20} color={colors.ink} /></Pressable>
          <AppText variant="caption">{formatWeekRangeRu(displayed[0]?.dateLocal ?? '', displayed[6]?.dateLocal ?? '')}</AppText>
          <Pressable style={styles.navButton} accessibilityRole="button" accessibilityLabel="Следующая неделя для переноса" onPress={() => setOffset(v => v + 1)}><Ionicons name="chevron-forward" size={20} color={colors.ink} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">
          {displayed.map((d) => (
            <Pressable
              key={d.dateLocal}
              onPress={() => onPick(d.dateLocal)}
              style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${mode === 'move' ? 'Перенести' : 'Копировать'} на ${d.label}`}
            >
              <AppText variant="body">{d.label}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, navButton: { minWidth: touchMin, minHeight: touchMin, justifyContent: 'center', alignItems: 'center' },
  pad: { padding: space.lg, gap: space.sm, maxHeight: '100%' },
  title: { fontWeight: '800' },
  sub: { marginBottom: space.sm },
  dayRow: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: space.sm,
  },
  pressed: { opacity: 0.85 },
});
