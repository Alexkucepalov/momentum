import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme/tokens';

export function PreviewBanner({ text }: { text: string }) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`Превью: ${text}`}
    >
      <Text style={styles.label}>Превью дизайна</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.preview,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.text,
    marginBottom: space.xs,
  },
  text: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
