import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CenteredFormModal } from '../../components/CenteredFormModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';

export type TargetsOnboardingValues = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
};

function parseOptional(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error('Число ≥ 0 или пусто');
  return n;
}

/**
 * UX-03 first-run goals. Skip allowed — does not invent targets.
 */
export function TargetsOnboardingSheet({
  visible,
  onSkip,
  onSave,
}: {
  visible: boolean;
  onSkip: () => void;
  onSave: (values: TargetsOnboardingValues) => void;
}) {
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setKcal('');
    setProtein('');
    setFat('');
    setCarbs('');
    setError(null);
  }, [visible]);

  const submit = () => {
    try {
      setError(null);
      const values = {
        energyKcal: parseOptional(kcal),
        proteinG: parseOptional(protein),
        fatG: parseOptional(fat),
        carbG: parseOptional(carbs),
      };
      if (
        values.energyKcal == null &&
        values.proteinG == null &&
        values.fatG == null &&
        values.carbG == null
      ) {
        throw new Error('Укажи хотя бы ккал — или нажми «Позже»');
      }
      onSave(values);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <CenteredFormModal visible={visible} onClose={onSkip} testID="targets-onboarding">
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Цели на день
        </Text>
        <Text style={styles.body}>
          КБЖУ задаёшь ты — приложение их не угадывает. Без целей «Что съесть» и бюджет работают
          слабее; это не оценка и не штраф.
        </Text>

        <Text style={styles.label}>Ккал (необязательно)</Text>
        <TextInput
          value={kcal}
          onChangeText={setKcal}
          keyboardType="decimal-pad"
          placeholder="например 2200"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          accessibilityLabel="Цель ккал"
        />
        <View style={styles.row}>
          <View style={styles.third}>
            <Text style={styles.label}>Белки, г</Text>
            <TextInput
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Цель белков"
            />
          </View>
          <View style={styles.third}>
            <Text style={styles.label}>Жиры, г</Text>
            <TextInput
              value={fat}
              onChangeText={setFat}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Цель жиров"
            />
          </View>
          <View style={styles.third}>
            <Text style={styles.label}>Углеводы, г</Text>
            <TextInput
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              style={styles.input}
              accessibilityLabel="Цель углеводов"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Сохранить" onPress={submit} />
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Пропустить настройку целей"
          style={styles.skip}
        >
          <Text style={styles.skipText}>Позже — продолжить без целей</Text>
        </Pressable>
      </View>
    </CenteredFormModal>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md, padding: space.lg, maxWidth: 400, width: '100%' },
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  body: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  label: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1, gap: 4, minWidth: 0 },
  error: { color: colors.danger, fontSize: type.caption },
  skip: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: type.body, fontWeight: '600', color: colors.textSecondary },
});
