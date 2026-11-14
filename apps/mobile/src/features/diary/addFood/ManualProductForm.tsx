import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import {
  kcalFromCompleteMacros,
  nutritionConsistencyHint,
  parseMacroField,
} from '../../../../../../src/domain/nutritionConsistency';
import { colors, radius, space, touchMin, type } from '../../../theme/tokens';
import { AppButton } from '@/src/design-system';

/**
 * New catalog product. Label kcal is independent of БЖУ (unknown macros stay null).
 * Atwater fill is opt-in — never overwrites a typed kcal field automatically.
 */
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
  const suggested = kcalFromCompleteMacros(
    parseMacroField(protein),
    parseMacroField(fat),
    parseMacroField(carbs),
  );
  const diverge = nutritionConsistencyHint({
    energyKcal: parseMacroField(kcal),
    proteinG: parseMacroField(protein),
    fatG: parseMacroField(fat),
    carbG: parseMacroField(carbs),
  });

  return (
    <View>
      <Text style={styles.lead}>
        Новый продукт на 100 г. Ккал с упаковки можно ввести отдельно; пустые БЖУ остаются
        неизвестными, не нулями.
      </Text>
      <Field label="Название" value={name} onChangeText={onChangeName} autoFocus placeholder="например Творог 5%" />

      <Text style={styles.section}>На 100 г</Text>
      <Field
        label="ккал"
        value={kcal}
        onChangeText={onChangeKcal}
        keyboardType="decimal-pad"
        placeholder="с этикетки, можно без БЖУ"
      />
      {suggested != null ? (
        <Pressable
          onPress={() => onChangeKcal(String(suggested))}
          style={styles.suggest}
          accessibilityRole="button"
          accessibilityLabel={`Подставить ${suggested} ккал из БЖУ`}
        >
          <Text style={styles.suggestText}>Подставить из БЖУ: {suggested} ккал</Text>
        </Pressable>
      ) : null}
      {diverge ? <Text style={styles.hint}>{diverge}</Text> : null}
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
        label="Порция по умолчанию, г"
        value={grams}
        onChangeText={onChangeGrams}
        keyboardType="decimal-pad"
        placeholder="100"
      />

      <AppButton label="К выбору порции" onPress={onSubmit} />
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
  suggest: {
    alignSelf: 'flex-start',
    marginTop: -space.sm,
    marginBottom: space.md,
    paddingVertical: space.xs,
  },
  suggestText: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: type.micro,
    color: colors.warning,
    marginBottom: space.md,
    lineHeight: 16,
  },
});
