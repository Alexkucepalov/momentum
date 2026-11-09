import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, colors, radius, space } from '@/src/design-system';

/**
 * Overlay status — must not push tab content (layout shift regression).
 */
export function GarminSyncBanner({
  running,
  note,
}: {
  running: boolean;
  note: string | null;
}) {
  const insets = useSafeAreaInsets();
  if (!running && !note) return null;
  return (
    <View
      pointerEvents="none"
      style={[styles.host, { paddingTop: Math.max(insets.top, space.sm) }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={running ? 'Синхронизация Garmin' : note ?? undefined}
    >
      <View style={styles.pill}>
        {running ? <ActivityIndicator size="small" color={colors.ink} /> : null}
        <AppText variant="caption" tone="secondary" style={styles.text}>
          {running ? 'Garmin: обновляю…' : note}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    maxWidth: '100%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  text: { flexShrink: 1 },
});
