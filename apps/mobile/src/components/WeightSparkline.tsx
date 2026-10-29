import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import {
  chronologicalKg,
  weightLinePoints,
} from '../../../../src/domain/weightTrend';
import { colors, radius, space, type } from '../theme/tokens';

const VB_W = 100;
const VB_H = 56;
const PAD_X = 4;
const PAD_Y = 6;

function toSvg(points: ReturnType<typeof weightLinePoints>) {
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  return points.map((p) => ({
    kg: p.kg,
    sx: PAD_X + p.x * innerW,
    // SVG y grows downward — invert unit y
    sy: PAD_Y + (1 - p.y) * innerH,
  }));
}

export function WeightSparkline({
  weightsNewestFirst,
}: {
  /** kg values, newest first (as from listWeights). */
  weightsNewestFirst: number[];
}) {
  const points = weightLinePoints(chronologicalKg(weightsNewestFirst));
  if (points.length < 2) {
    return (
      <Text style={styles.hint}>
        Нужно хотя бы два взвешивания, чтобы показать спокойный тренд — без целей и оценок.
      </Text>
    );
  }

  const svgPts = toSvg(points);
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const delta = Math.round((last.kg - first.kg) * 10) / 10;
  const deltaLabel =
    delta === 0 ? 'без заметного сдвига' : delta > 0 ? `+${delta} кг` : `${delta} кг`;
  const polyline = svgPts.map((p) => `${p.sx},${p.sy}`).join(' ');

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`Тренд веса: ${first.kg} до ${last.kg} килограмм, ${deltaLabel}`}
    >
      <View style={styles.chart}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.text}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {svgPts.map((p, i) => (
            <Circle
              key={`${p.kg}-${i}`}
              cx={p.sx}
              cy={p.sy}
              r={i === 0 || i === svgPts.length - 1 ? 2.2 : 1.6}
              fill={colors.text}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{first.kg} кг</Text>
        <Text style={styles.legendMid}>{deltaLabel}</Text>
        <Text style={styles.legendText}>{last.kg} кг</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.md,
    marginBottom: space.md,
  },
  chart: {
    height: 88,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  legendText: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '600' },
  legendMid: { fontSize: type.caption, color: colors.textMuted },
  hint: {
    marginTop: space.sm,
    marginBottom: space.md,
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
