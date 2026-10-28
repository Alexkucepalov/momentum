import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, space, type } from '../theme/tokens';
import { useData } from '../state/DataContext';
import { AppCard } from '@/src/ui/AppCard';

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
    <AppCard
      padding="md"
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={flash}
    >
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {flash}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: 72,
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
