import { StyleSheet, View } from 'react-native';

import { nothing, nothingSpace } from '@/src/theme/nothing';

/** Small glyph-style dot row — identity mark, not decoration noise. */
export function GlyphDots({ count = 5, active = 2 }: { count?: number; active?: number }) {
  const n = Math.max(1, Math.min(12, count));
  const a = Math.max(0, Math.min(n, active));
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={[styles.dot, i < a ? styles.dotOn : styles.dotOff]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotOn: { backgroundColor: nothing.display },
  dotOff: { backgroundColor: nothing.lineStrong },
});

export function GlyphSpacer() {
  return <View style={{ height: nothingSpace.sm }} />;
}
