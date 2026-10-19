import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme/tokens';
import { useData } from '../state/DataContext';

/** Non-destructive toast (copy day, save confirmation). Sits above UndoBar. */
export function FlashBar() {
  const { flash, clearFlash } = useData();

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => clearFlash(), 2600);
    return () => clearTimeout(t);
  }, [flash, clearFlash]);

  if (!flash) return null;

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite" accessibilityRole="text">
      <Text style={styles.message}>{flash}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: 72,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    zIndex: 19,
    alignItems: 'center',
  },
  message: {
    color: colors.text,
    fontSize: type.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
