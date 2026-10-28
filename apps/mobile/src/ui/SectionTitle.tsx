import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';

/** Canonical section header for Nutrition Soft Light screens. */
export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
    marginTop: space.sm,
    gap: space.sm,
  },
  title: {
    flex: 1,
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  action: { flexShrink: 0 },
});
