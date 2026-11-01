import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

/** Collapsible technical Garmin warnings (L7). */
export function GarminWarningsBlock({
  title = 'Технические предупреждения',
  lines,
}: {
  title?: string;
  lines: string[];
}) {
  const [open, setOpen] = useState(false);
  if (lines.length === 0) return null;

  return (
    <View style={styles.wrap} testID="garmin-warnings">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.head}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${lines.length}. ${open ? 'Свернуть' : 'Развернуть'}`}
      >
        <AppText variant="caption" tone="secondary" style={styles.headText}>
          {title} · {lines.length}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open
        ? lines.map((line, i) => (
            <AppText key={`${i}-${line.slice(0, 24)}`} variant="caption" tone="muted" style={styles.line}>
              {line}
            </AppText>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: space.sm,
    gap: space.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchMin - 8,
    gap: space.sm,
  },
  headText: { flex: 1, fontWeight: '700' },
  line: { lineHeight: 18 },
});
