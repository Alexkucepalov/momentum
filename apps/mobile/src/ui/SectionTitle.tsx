import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme/tokens';

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
      {action}
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
  },
  title: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
});
