import { StyleSheet, View } from 'react-native';

import type { WorkoutHrZone } from '../../../../../src/storage/types';
import { AppText, colors, space } from '@/src/design-system';

const ZONE_COLORS = ['#9CA3AF', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

export function HrZonesBar({ zones }: { zones: WorkoutHrZone[] | null }) {
  if (!zones || zones.length === 0) {
    return (
      <AppText variant="caption" tone="muted">
        Зоны пульса не пришли в ответе Garmin
      </AppText>
    );
  }
  const total = zones.reduce((s, z) => s + z.secs, 0);
  if (total <= 0) {
    return (
      <AppText variant="caption" tone="muted">
        Зоны пульса без длительности
      </AppText>
    );
  }
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {zones.map((z) => (
          <View
            key={z.zone}
            style={{
              flex: Math.max(z.secs / total, 0.02),
              backgroundColor: ZONE_COLORS[(z.zone - 1) % ZONE_COLORS.length],
              height: 10,
            }}
          />
        ))}
      </View>
      {zones.map((z) => (
        <AppText key={z.zone} variant="caption" tone="secondary">
          Зона {z.zone}: {Math.round(z.secs / 60)} мин ({Math.round((100 * z.secs) / total)}%)
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: space.sm },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
    marginBottom: 4,
  },
});
