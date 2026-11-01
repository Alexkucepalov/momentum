import { StyleSheet, View } from 'react-native';

import { AppText, colors, radius, space } from '@/src/design-system';

export function AddFoodEmptyHint({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty} accessibilityRole="summary">
      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.body}>
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
  },
  title: { fontWeight: '700', marginBottom: space.sm },
  body: { lineHeight: 22 },
});
