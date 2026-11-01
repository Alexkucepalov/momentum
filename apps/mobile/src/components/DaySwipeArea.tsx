import { type ReactNode, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { shiftDateLocal } from '../../../../src/domain/repeatMeal';

type DaySwipeAreaProps = {
  dateLocal: string;
  onDateChange: (next: string) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  thresholdPx?: number;
};

/**
 * Horizontal swipe changes the shared diary day.
 * Soft opacity crossfade — no translateX jerk against vertical scroll.
 */
export function DaySwipeArea({
  dateLocal,
  onDateChange,
  children,
  style,
  thresholdPx = 64,
}: DaySwipeAreaProps) {
  const dateRef = useRef(dateLocal);
  dateRef.current = dateLocal;
  const onChangeRef = useRef(onDateChange);
  onChangeRef.current = onDateChange;
  const opacity = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          !busy.current &&
          Math.abs(g.dx) > 18 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          !busy.current &&
          Math.abs(g.dx) > 28 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: (_e, g) => {
          const goNext = g.dx <= -thresholdPx;
          const goPrev = g.dx >= thresholdPx;
          if (!goNext && !goPrev) return;
          if (busy.current) return;
          busy.current = true;
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 120,
            useNativeDriver: true,
          }).start(() => {
            onChangeRef.current(shiftDateLocal(dateRef.current, goNext ? 1 : -1));
            Animated.timing(opacity, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              busy.current = false;
            });
          });
        },
      }),
    [thresholdPx, opacity],
  );

  return (
    <Animated.View
      style={[styles.fill, style, { opacity }]}
      {...pan.panHandlers}
      accessibilityHint="Свайп влево или вправо — другой день"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
