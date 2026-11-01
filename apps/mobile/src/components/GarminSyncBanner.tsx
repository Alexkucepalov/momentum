import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, colors, radius, space } from '@/src/design-system';

export function GarminSyncBanner({
  running,
  note,
}: {
  running: boolean;
  note: string | null;
}) {
  if (!running && !note) return null;
  return (
    <View
      style={styles.wrap}
      accessibilityLiveRegion="polite"
      accessibilityLabel={running ? 'Синхронизация Garmin' : note ?? undefined}
    >
      {running ? <ActivityIndicator size="small" color={colors.ink} /> : null}
      <AppText variant="caption" tone="secondary" style={styles.text}>
        {running ? 'Garmin: обновляю…' : note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
  },
  text: { flex: 1 },
});
