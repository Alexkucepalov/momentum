import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CenteredFormModal } from './CenteredFormModal';
import { PortionStepper } from './PortionStepper';
import { colors, space, touchMin, type } from '../theme/tokens';
import { AppButton } from '@/src/design-system';

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
    <CenteredFormModal visible={visible} onClose={onClose}>
      <Text style={styles.title} accessibilityRole="header">
        Граммы
      </Text>
      <Text style={styles.subtitle}>{title}</Text>
      <PortionStepper grams={grams} onChange={setGrams} />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.secondary}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Отмена"
        >
          <Text style={styles.secondaryText}>Отмена</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppButton label="Сохранить" onPress={save} />
        </View>
      </View>
    </CenteredFormModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: type.title,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: space.xs,
    marginBottom: space.lg,
    color: colors.textSecondary,
    fontSize: type.body,
  },
  error: {
    marginTop: space.sm,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  secondary: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: type.body,
  },
});
