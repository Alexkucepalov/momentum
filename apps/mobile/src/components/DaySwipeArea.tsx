import { type ReactNode, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shiftDateLocal } from '../../../../src/domain/repeatMeal';
import { colors, space } from '@/src/design-system';

type DaySwipeAreaProps = {
  dateLocal: string;
  onDateChange: (next: string) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Min horizontal travel to change day. Higher = less fight with row delete. */
  thresholdPx?: number;
};

/**
 * Horizontal day change — only claims the gesture when the child does not.
 * No capture: entry swipe-to-delete wins. Visual = soft slide + edge chevrons.
 */
export function DaySwipeArea({
  dateLocal,
  onDateChange,
  children,
  style,
  thresholdPx = 88,
}: DaySwipeAreaProps) {
  const dateRef = useRef(dateLocal);
  dateRef.current = dateLocal;
  const onChangeRef = useRef(onDateChange);
  onChangeRef.current = onDateChange;

  const shift = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Never capture — MealSection / FlatList get first refusal.
        onMoveShouldSetPanResponder: (_e, g) =>
          !busy.current &&
          Math.abs(g.dx) > 36 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 2.2,
        onPanResponderTerminationRequest: () => true,
        onPanResponderMove: (_e, g) => {
          if (busy.current) return;
          const clamped = Math.max(-72, Math.min(72, g.dx * 0.35));
          shift.setValue(clamped);
          const strength = Math.min(1, Math.abs(g.dx) / thresholdPx);
          hint.setValue(strength);
        },
        onPanResponderRelease: (_e, g) => {
          const goNext = g.dx <= -thresholdPx && Math.abs(g.dx) > Math.abs(g.dy);
          const goPrev = g.dx >= thresholdPx && Math.abs(g.dx) > Math.abs(g.dy);
          if (!goNext && !goPrev) {
            Animated.parallel([
              Animated.spring(shift, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
              Animated.timing(hint, { toValue: 0, duration: 140, useNativeDriver: true }),
            ]).start();
            return;
          }
          if (busy.current) return;
          busy.current = true;
          const exitX = goNext ? -56 : 56;
          Animated.parallel([
            Animated.timing(shift, { toValue: exitX, duration: 140, useNativeDriver: true }),
            Animated.timing(hint, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start(() => {
            onChangeRef.current(shiftDateLocal(dateRef.current, goNext ? 1 : -1));
            shift.setValue(goNext ? 56 : -56);
            Animated.spring(shift, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
              speed: 18,
            }).start(() => {
              busy.current = false;
            });
          });
        },
        onPanResponderTerminate: () => {
          Animated.parallel([
            Animated.spring(shift, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
            Animated.timing(hint, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]).start();
        },
      }),
    [thresholdPx, shift, hint],
  );

  const leftHintOpacity = hint.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });
  const rightHintOpacity = hint.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });
  const leftHintX = shift.interpolate({
    inputRange: [-72, 0, 72],
    outputRange: [0, 0, 8],
    extrapolate: 'clamp',
  });
  const rightHintX = shift.interpolate({
    inputRange: [-72, 0, 72],
    outputRange: [-8, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.fill, style]} accessibilityHint="Свайп влево или вправо — другой день">
      <Animated.View
        pointerEvents="none"
        style={[styles.edgeHint, styles.edgeLeft, { opacity: leftHintOpacity, transform: [{ translateX: leftHintX }] }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.edgeHint, styles.edgeRight, { opacity: rightHintOpacity, transform: [{ translateX: rightHintX }] }]}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Animated.View>
      <Animated.View style={[styles.fill, { transform: [{ translateX: shift }] }]} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  edgeHint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  edgeLeft: { left: space.xs },
  edgeRight: { right: space.xs },
});
