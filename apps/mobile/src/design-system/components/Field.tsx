import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, space, touchMin, type } from '../tokens';
import { AppText } from './AppText';

type FieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  helper?: string | null;
  testID?: string;
};

/** Labeled text field — Premium Minimal Utility. */
export function Field({ label, error, helper, style, testID, ...rest }: FieldProps) {
  return (
    <View style={styles.wrap} testID={testID}>
      <AppText variant="label" tone="muted" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        accessibilityLabel={label}
      />
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.meta}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" tone="muted" style={styles.meta}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.xs },
  input: {
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.ink,
  },
  inputError: {
    borderColor: colors.danger,
  },
  meta: { marginTop: space.xs },
});
