import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, space } from '@/src/design-system';

export function EditPlannedGramsSheet({
  visible,
  mealName,
  grams,
  onClose,
  onSave,
}: {
  visible: boolean;
  mealName: string;
  grams: number;
  onClose: () => void;
  onSave: (grams: number) => void;
}) {
  const [raw, setRaw] = useState(String(grams));

  useEffect(() => {
    if (visible) setRaw(String(grams));
  }, [visible, grams]);

  return (
    <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.5}>
      <View style={styles.pad}>
        <AppText variant="title" style={styles.title}>
          Порция
        </AppText>
        <AppText variant="caption" tone="muted">
          {mealName}
        </AppText>
        <Field
          label="Граммы"
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
          autoFocus
        />
        <AppButton
          label="Сохранить"
          onPress={() => {
            const n = Number(raw.replace(',', '.'));
            if (!Number.isFinite(n) || n <= 0) return;
            onSave(n);
            onClose();
          }}
        />
      </View>
    </SwipeToDismissSheet>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.sm },
  title: { fontWeight: '800' },
});
