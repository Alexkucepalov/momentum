import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PortionStepper } from './PortionStepper';
import { SwipeToDismissSheet } from './SwipeToDismissSheet';
import { colors, space, touchMin, type } from '../theme/tokens';
import { AppButton } from '@/src/design-system';

/**
 * Diary entry grams editor — bottom sheet, stepper stays in bounds,
 * primary save pinned below content.
 */
export function PortionEditModal({
  visible,
  title,
  initialGrams,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  initialGrams: number;
  onClose: () => void;
  onSave: (grams: number) => void;
}) {
  const [grams, setGrams] = useState(initialGrams);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setGrams(initialGrams);
      setError(null);
    }
  }, [visible, initialGrams]);

  const save = () => {
    if (!Number.isFinite(grams) || grams < 0) {
      setError('Введи число ≥ 0');
      return;
    }
    onSave(grams);
    onClose();
  };

  return (
    <SwipeToDismissSheet
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.72}
      testID="portion-edit-sheet"
    >
      <View style={styles.shell}>
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Граммы
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть">
              <Text style={styles.close}>Закрыть</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>
            {title}
          </Text>

          <PortionStepper grams={grams} onChange={setGrams} lastGrams={initialGrams} />

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <AppButton label="Сохранить" onPress={save} testID="portion-edit-save" />
        </View>
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: '100%',
  },
  body: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: {
    fontSize: type.title,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
    minHeight: touchMin,
    textAlignVertical: 'center',
  },
  subtitle: {
    marginBottom: space.lg,
    color: colors.textSecondary,
    fontSize: type.body,
  },
  error: {
    marginTop: space.sm,
    color: colors.danger,
    fontSize: type.caption,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
