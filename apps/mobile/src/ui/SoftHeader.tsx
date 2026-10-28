import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';

/** Greeting / screen header — eyebrow + bold title + trailing action (ref 08). */
export function SoftHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
    gap: space.md,
  },
  textCol: { flex: 1, gap: 4 },
  eyebrow: {
    fontSize: type.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  title: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
  },
});
