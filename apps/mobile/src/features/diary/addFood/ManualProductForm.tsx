import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { autoKcalStringFromMacroStrings } from '../../../../../../src/domain/nutritionConsistency';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { colors, radius, space, touchMin, type } from '../../../theme/tokens';

export function ManualProductForm({
  name,
  grams,
  kcal,
  protein,
  fat,
  carbs,
  onChangeName,
  onChangeGrams,
  onChangeKcal,
  onChangeProtein,
  onChangeFat,
  onChangeCarbs,
  onSubmit,
}: {
  name: string;
  grams: string;
  kcal: string;
  protein: string;
  fat: string;
  carbs: string;
  onChangeName: (t: string) => void;
  onChangeGrams: (t: string) => void;
  onChangeKcal: (t: string) => void;
  onChangeProtein: (t: string) => void;
  onChangeFat: (t: string) => void;
  onChangeCarbs: (t: string) => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    const next = autoKcalStringFromMacroStrings(protein, fat, carbs);
    if (next !== null && next !== kcal) onChangeKcal(next);
  }, [protein, fat, carbs, kcal, onChangeKcal]);

  return (
    <View>
      <Text style={styles.lead}>
        Новый продукт. Сначала Б/Ж/У на 100 г (ккал сами: 4×Б+9×Ж+4×У). Пустое = неизвестно.
      </Text>
      <Field label="Название" value={name} onChangeText={onChangeName} autoFocus placeholder="например Творог 5%" />

      <Text style={styles.section}>На 100 г</Text>
      <View style={styles.macroRow}>
        <View style={styles.third}>
          <Field label="Белки" value={protein} onChangeText={onChangeProtein} keyboardType="decimal-pad" />
        </View>
        <View style={styles.third}>
          <Field label="Жиры" value={fat} onChangeText={onChangeFat} keyboardType="decimal-pad" />
        </View>
        <View style={styles.third}>
          <Field label="Углеводы" value={carbs} onChangeText={onChangeCarbs} keyboardType="decimal-pad" />
        </View>
      </View>
      <Field
        label="ккал (авто из БЖУ)"
        value={kcal}
        onChangeText={onChangeKcal}
        keyboardType="decimal-pad"
        placeholder="считается из БЖУ"
      />
      <Field
        label="Порция по умолчанию, г"
        value={grams}
        onChangeText={onChangeGrams}
        keyboardType="decimal-pad"
        placeholder="100"
      />

      <PrimaryButton label="К выбору порции" onPress={onSubmit} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel={label}
        autoFocus={autoFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.lg,
  },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  field: { marginBottom: space.md },
  fieldLabel: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginBottom: space.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  macroRow: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1 },
});
