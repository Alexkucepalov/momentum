import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from 'react-native-svg';

import {
  chronologicalKg,
  weightLinePoints,
} from '../../../../src/domain/weightTrend';
import { colors, radius, space, type, surfaceCard } from '../theme/tokens';

const VB_W = 280;
const VB_H = 120;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 18;

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

function toSvg(points: ReturnType<typeof weightLinePoints>) {
  const innerW = VB_W - PAD_L - PAD_R;
  const innerH = VB_H - PAD_T - PAD_B;
  return points.map((p) => ({
    kg: p.kg,
    sx: PAD_L + p.x * innerW,
    sy: PAD_T + (1 - p.y) * innerH,
  }));
}

export type WeightChartEntry = {
  kg: number;
  weighedAt: string;
};

export function WeightSparkline({
  weightsNewestFirst,
  entriesNewestFirst,
}: {
  /** kg values, newest first (as from listWeights). */
  weightsNewestFirst: number[];
  /** Optional full entries for date labels (same order as weights). */
  entriesNewestFirst?: WeightChartEntry[];
}) {
  const chronoKg = chronologicalKg(weightsNewestFirst);
  const points = weightLinePoints(chronoKg);
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
  const minKg = Math.min(...points.map((p) => p.kg));
  const maxKg = Math.max(...points.map((p) => p.kg));
  const delta = Math.round((last.kg - first.kg) * 10) / 10;
  const deltaLabel =
    delta === 0 ? 'без заметного сдвига' : delta > 0 ? `+${delta} кг` : `${delta} кг`;

  const linePath = svgPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.sx.toFixed(2)} ${p.sy.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${svgPts[svgPts.length - 1]!.sx.toFixed(2)} ${(VB_H - PAD_B).toFixed(2)} L${svgPts[0]!.sx.toFixed(2)} ${(VB_H - PAD_B).toFixed(2)} Z`;

  const guideYs = [0, 0.5, 1].map((t) => PAD_T + (1 - t) * (VB_H - PAD_T - PAD_B));
  const midKg = Math.round(((minKg + maxKg) / 2) * 10) / 10;

  const chronoEntries = entriesNewestFirst
    ? [...entriesNewestFirst].reverse()
    : null;
  const firstDate = chronoEntries?.[0]?.weighedAt
    ? new Date(chronoEntries[0].weighedAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
    : null;
  const lastDate = chronoEntries?.[chronoEntries.length - 1]?.weighedAt
    ? new Date(chronoEntries[chronoEntries.length - 1]!.weighedAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={`Тренд веса: ${formatKg(first.kg)} до ${formatKg(last.kg)} килограмм, ${deltaLabel}`}
    >
      <View style={styles.chart}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.text} stopOpacity={0.16} />
              <Stop offset="1" stopColor={colors.text} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {guideYs.map((y, i) => (
            <Line
              key={`g-${i}`}
              x1={PAD_L}
              y1={y}
              x2={VB_W - PAD_R}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray={i === 1 ? '4 4' : undefined}
            />
          ))}
          <Path d={areaPath} fill="url(#weightFill)" />
          <Path
            d={linePath}
            fill="none"
            stroke={colors.text}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {svgPts.map((p, i) => (
            <Circle
              key={`${p.kg}-${i}`}
              cx={p.sx}
              cy={p.sy}
              r={i === 0 || i === svgPts.length - 1 ? 3.2 : 2.2}
              fill={colors.surface}
              stroke={colors.text}
              strokeWidth={1.6}
            />
          ))}
        </Svg>
        <View style={styles.yAxis} pointerEvents="none">
          <Text style={styles.yLabel}>{formatKg(maxKg)}</Text>
          <Text style={styles.yLabel}>{formatKg(midKg)}</Text>
          <Text style={styles.yLabel}>{formatKg(minKg)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendCol}>
          <Text style={styles.legendText}>{formatKg(first.kg)} кг</Text>
          {firstDate ? <Text style={styles.legendDate}>{firstDate}</Text> : null}
        </View>
        <Text style={styles.legendMid}>{deltaLabel}</Text>
        <View style={[styles.legendCol, styles.legendColEnd]}>
          <Text style={styles.legendText}>{formatKg(last.kg)} кг</Text>
          {lastDate ? <Text style={styles.legendDate}>{lastDate}</Text> : null}
        </View>
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
    height: 148,
    ...surfaceCard,
    overflow: 'hidden',
    position: 'relative',
  },
  yAxis: {
    position: 'absolute',
    left: 6,
    top: 10,
    bottom: 14,
    justifyContent: 'space-between',
  },
  yLabel: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: space.sm,
  },
  legendCol: { flex: 1 },
  legendColEnd: { alignItems: 'flex-end' },
  legendText: { fontSize: type.caption, color: colors.textSecondary, fontWeight: '700' },
  legendDate: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  legendMid: {
    fontSize: type.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: space.sm,
    marginTop: 2,
  },
  hint: {
    marginTop: space.sm,
    marginBottom: space.md,
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
