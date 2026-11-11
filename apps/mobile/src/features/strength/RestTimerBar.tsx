import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, colors, radius, space, touchMin } from '@/src/design-system';

export function RestTimerBar({
  seconds,
  onSkip,
  onDone,
}: {
  seconds: number;
  onSkip: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View style={styles.bar} testID="rest-timer-bar" accessibilityLabel={`Отдых ${mm}:${ss}`}>
      <AppText variant="subtitle">Отдых {mm}:{ss}</AppText>
      <Pressable
        onPress={onSkip}
        style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Пропустить отдых"
        testID="rest-timer-skip"
      >
        <AppText variant="caption">Пропустить</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: space.sm,
  },
  skip: {
    minHeight: touchMin - 8,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
