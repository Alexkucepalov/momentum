import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '../theme/tokens';
import { useData } from '../state/DataContext';

const AUTO_DISMISS_MS = 4200;
/** Approx tab bar content height (icons+label) above system inset. */
const TAB_BAR_CONTENT = 52;

export function UndoBar() {
  const { undo, performUndo, setUndo } = useData();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [undo, setUndo]);

  if (!undo) return null;

  const bottom = TAB_BAR_CONTENT + Math.max(insets.bottom, space.sm) + space.sm;

  return (
    <View style={[styles.wrap, { bottom }]} accessibilityLiveRegion="polite">
      <Text style={styles.message} numberOfLines={1}>
        {undo.message}
      </Text>
      <Pressable
        onPress={performUndo}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel="Отменить"
        hitSlop={8}
      >
        <Text style={styles.btnText}>Отменить</Text>
      </Pressable>
      <Pressable
        onPress={() => setUndo(null)}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        hitSlop={8}
      >
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 48,
  },
  message: {
    flex: 1,
    color: colors.primaryButtonText,
    fontSize: type.caption,
    fontWeight: '600',
  },
  btn: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  btnText: {
    color: colors.primaryButtonText,
    fontWeight: '800',
    fontSize: type.caption,
  },
  dismiss: {
    padding: space.xs,
  },
  dismissText: {
    color: colors.textMuted,
    fontSize: type.body,
  },
});
