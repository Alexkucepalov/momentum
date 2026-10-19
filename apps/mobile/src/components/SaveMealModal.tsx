import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CenteredFormModal } from './CenteredFormModal';
import { PrimaryButton } from './PrimaryButton';
import { colors, radius, space, touchMin, type } from '../theme/tokens';

export function SaveMealModal({
  visible,
  defaultName,
  onClose,
  onSave,
}: {
  visible: boolean;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(defaultName);
      setError(null);
    }
  }, [visible, defaultName]);

  const save = () => {
    const t = name.trim();
    if (!t) {
      setError('Введи название');
      return;
    }
    onSave(t);
    onClose();
  };

  return (
    <CenteredFormModal visible={visible} onClose={onClose}>
      <Text style={styles.title} accessibilityRole="header">
        Сохранить приём
      </Text>
      <Text style={styles.hint}>Потом добавишь все позиции одним тапом.</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="например Завтрак будни"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoFocus
        accessibilityLabel="Название сохранённого приёма"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Сохранить" onPress={save} />
        </View>
      </View>
    </CenteredFormModal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  hint: {
    marginTop: space.xs,
    marginBottom: space.md,
    color: colors.textSecondary,
    fontSize: type.caption,
  },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: space.sm, fontSize: type.caption },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  cancel: { minHeight: touchMin, justifyContent: 'center', paddingHorizontal: space.md },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
});
