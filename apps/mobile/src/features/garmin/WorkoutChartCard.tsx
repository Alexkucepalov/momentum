import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { parseChartJson, projectChartSeries } from '../../../../../src/domain/garmin';
import { AppCard, AppText, colors, space } from '@/src/design-system';

const W = 320;
const H = 96;

export function WorkoutChartCard({ chartJson }: { chartJson: string | null }) {
  const charts = parseChartJson(chartJson);
  if (!charts || charts.series.length === 0) {
    return (
      <AppCard>
        <AppText variant="subtitle">Графики</AppText>
        <AppText variant="caption" tone="muted">
          Посекундные ряды (пульс / скорость / мощность) не пришли в details. Сделай полную
          выгрузку ещё раз.
        </AppText>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppText variant="subtitle">Графики по времени</AppText>
      {charts.series.map((s) => {
        const projected = projectChartSeries(s, W, H);
        if (!projected) return null;
        return (
          <View key={s.key} style={styles.block}>
            <AppText variant="caption" tone="secondary">
              {s.labelRu} · {projected.minV.toFixed(0)}–{projected.maxV.toFixed(0)} {s.unit}
            </AppText>
            <View style={styles.chartWrap}>
              <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
                <Polyline
                  points={projected.pointsAttr}
                  fill="none"
                  stroke={colors.ink}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>
        );
      })}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4, marginTop: space.sm },
  chartWrap: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: H,
  },
});
