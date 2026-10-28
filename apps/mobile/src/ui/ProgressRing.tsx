import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, type } from '@/src/theme/tokens';

/** Mono progress ring — Activity ref 10 (black stroke, no accent invent). */
export function ProgressRing({
  ratio,
  center,
  caption,
  size = 112,
  stroke = 12,
}: {
  /** 0..1 observational fill; unknown/empty → 0. */
  ratio: number;
  center: string;
  caption?: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(1, ratio));
  const offset = c * (1 - fill);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.ringTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.ringFill}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} accessibilityElementsHidden>
        <Text style={styles.value}>{center}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  caption: {
    fontSize: type.micro,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
