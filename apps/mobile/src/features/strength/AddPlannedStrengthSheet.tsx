import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { WorkoutTemplate } from '../../../../../src/domain/strength/types';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

export function AddPlannedStrengthSheet({
  visible,
  dateLabel,
  templates,
  onClose,
  onPickTemplate,
  onAddRest,
  onAddCardio,
}: {
  visible: boolean;
  dateLabel: string;
  templates: WorkoutTemplate[];
  onClose: () => void;
  onPickTemplate: (templateId: string) => void;
  onAddRest: () => void;
  onAddCardio: () => void;
}) {
  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.75}
      testID="add-planned-strength-sheet"
    >
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Добавить в план
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.sub}>
          {dateLabel} · это план, не дневник факта
        </AppText>
        <ScrollView keyboardShouldPersistTaps="handled">
          {templates.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => onPickTemplate(t.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Добавить ${t.name}`}
            >
              <AppText variant="body">{t.name}</AppText>
              {t.subtitle ? (
                <AppText variant="caption" tone="muted">
                  {t.subtitle}
                </AppText>
              ) : null}
            </Pressable>
          ))}
          <Pressable
            onPress={onAddCardio}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Добавить велотренировку"
          >
            <AppText variant="body">Вело · 30 мин</AppText>
          </Pressable>
          <Pressable
            onPress={onAddRest}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Добавить день отдыха"
          >
            <AppText variant="body">Отдых</AppText>
          </Pressable>
        </ScrollView>
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm, maxHeight: '100%' },
  title: { fontWeight: '800' },
  sub: { marginBottom: space.sm },
  row: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: space.sm,
    gap: 2,
  },
  pressed: { opacity: 0.85 },
});
