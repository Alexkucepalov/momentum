import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/src/theme/tokens';

/** Equal-gap 2-column soft bento (ref 08 wellness grid). */
export function BentoRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
});
