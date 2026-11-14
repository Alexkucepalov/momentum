import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '../theme/tokens';

/** Sticky bottom bar above tab bar — pads for home indicator / gesture nav. */
export function ScreenFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  // Tab bar already sits above the system inset; keep a modest extra pad for the CTA row.
  const bottomPad = Math.max(insets.bottom > 0 ? space.sm : space.md, space.sm);
  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.screen,
    paddingTop: space.sm,
    backgroundColor: colors.background,
  },
});
