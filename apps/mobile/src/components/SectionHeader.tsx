import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';

import { colors, space, type } from '../theme/tokens';

export function SectionHeader({
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
    marginTop: space.xs,
    gap: space.sm,
  },
  title: {
    flex: 1,
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  action: { flexShrink: 0 },
});
