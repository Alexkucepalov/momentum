import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from 'react-native-svg';

import {
  chronologicalKg,
  weightLinePoints,
} from '../../../../src/domain/weightTrend';
import { AppText, ChartFrame, colors, space } from '@/src/design-system';

const CHART_H = 140;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 14;

type SvgPt = { kg: number; sx: number; sy: number };

function buildSvgPoints(
  points: ReturnType<typeof weightLinePoints>,
  width: number,
): SvgPt[] {
  const innerW = Math.max(width - PAD_L - PAD_R, 1);
  const innerH = CHART_H - PAD_T - PAD_B;
  return points.map((p) => ({
    kg: p.kg,
    sx: PAD_L + p.x * innerW,
    sy: PAD_T + (1 - p.y) * innerH,
  }));
}

function linePath(pts: SvgPt[]): string {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx.toFixed(2)} ${p.sy.toFixed(2)}`).join(' ');
}

function areaPath(pts: SvgPt[]): string {
  if (pts.length === 0) return '';
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const baseline = CHART_H - PAD_B;
  return `${linePath(pts)} L${last.sx.toFixed(2)} ${baseline} L${first.sx.toFixed(2)} ${baseline} Z`;
}

export function WeightSparkline({
  weightsNewestFirst,
}: {
  /** kg values, newest first (as from listWeights). */
  weightsNewestFirst: number[];
}) {
  const [width, setWidth] = useState(0);
  const points = useMemo(
    () => weightLinePoints(chronologicalKg(weightsNewestFirst)),
    [weightsNewestFirst],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== width) setWidth(w);
  };

  if (points.length < 2) {
    return (
      <AppText variant="caption" tone="muted" style={styles.hint}>
        Нужно хотя бы два взвешивания, чтобы показать тренд — без целей и оценок.
      </AppText>
    );
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const delta = Math.round((last.kg - first.kg) * 10) / 10;
  const deltaLabel =
    delta === 0 ? 'без заметного сдвига' : delta > 0 ? `+${delta} кг` : `${delta} кг`;

  const svgPts = width > 0 ? buildSvgPoints(points, width) : [];
  const stroke = linePath(svgPts);
  const fill = areaPath(svgPts);
  const guidesY = [0.25, 0.5, 0.75].map((t) => PAD_T + t * (CHART_H - PAD_T - PAD_B));

  return (
    <ChartFrame
      title="Тренд веса"
      subtitle={`${first.kg} → ${last.kg} кг · ${deltaLabel}`}
      footnote="Шкала не меньше ±1 кг вокруг ряда — мелкий шум не раздувается."
      testID="weight-sparkline"
    >
      <View
        style={styles.plot}
        onLayout={onLayout}
        accessibilityRole="summary"
        accessibilityLabel={`Тренд веса: ${first.kg} до ${last.kg} килограмм, ${deltaLabel}`}
      >
        {width > 0 ? (
          <Svg width={width} height={CHART_H}>
            <Defs>
              <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.ink} stopOpacity={0.12} />
                <Stop offset="1" stopColor={colors.ink} stopOpacity={0.01} />
              </LinearGradient>
            </Defs>
            {guidesY.map((y) => (
              <Line
                key={y}
                x1={PAD_L}
                y1={y}
                x2={width - PAD_R}
                y2={y}
                stroke={colors.border}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            ))}
            <Path d={fill} fill="url(#weightFill)" />
            <Path
              d={stroke}
              fill="none"
              stroke={colors.ink}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {svgPts.length > 0 ? (
              <>
                <Circle
                  cx={svgPts[0]!.sx}
                  cy={svgPts[0]!.sy}
                  r={3.5}
                  fill={colors.surface}
                  stroke={colors.ink}
                  strokeWidth={1.5}
                />
                <Circle
                  cx={svgPts[svgPts.length - 1]!.sx}
                  cy={svgPts[svgPts.length - 1]!.sy}
                  r={4}
                  fill={colors.ink}
                />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>
      <View style={styles.legend}>
        <AppText variant="caption" tone="secondary" style={styles.legendEdge}>
          {first.kg} кг
        </AppText>
        <AppText variant="caption" tone="muted">
          {points.length} зам.
        </AppText>
        <AppText variant="caption" tone="secondary" style={styles.legendEdge}>
          {last.kg} кг
        </AppText>
      </View>
    </ChartFrame>
  );
}

const styles = StyleSheet.create({
  plot: {
    height: CHART_H,
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  legendEdge: { fontWeight: '600' },
  hint: {
    marginVertical: space.sm,
    lineHeight: 18,
  },
});
