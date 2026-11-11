import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
        <ScrollView keyboardShouldPersistTaps="handled">
          {days.map((d) => (
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
