import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/src/theme/tokens';

/** Small meta chip — e.g. «Б 32г» under a food row (Nutrition ref). */
export function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
