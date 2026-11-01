import { Linking, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import {
  googleMapsTrackUrl,
  parsePolylineJson,
  projectTrackToViewBox,
  yandexMapsTrackUrl,
} from '../../../../../src/domain/garmin';
import { AppButton, AppCard, AppText, colors, space } from '@/src/design-system';

const W = 320;
const H = 200;

export function TrackMapCard({
  polylineJson,
  distanceM,
}: {
  polylineJson: string | null;
  distanceM: number | null;
}) {
  const poly = parsePolylineJson(polylineJson);
  if (!poly || poly.points.length < 2) {
    return (
      <AppCard>
        <AppText variant="subtitle">Трек</AppText>
        <AppText variant="caption" tone="muted">
          GPS-трек не пришёл (зал / сила / нет спутников). После полной выгрузки с GPS он появится
          здесь.
        </AppText>
      </AppCard>
    );
  }

  const projected = projectTrackToViewBox(poly, W, H);
  const google = googleMapsTrackUrl(poly);
  const yandex = yandexMapsTrackUrl(poly);
  const dist =
    distanceM != null
      ? distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(2)} км`
        : `${Math.round(distanceM)} м`
      : null;

  return (
    <AppCard>
      <AppText variant="subtitle">Трек</AppText>
      {dist ? (
        <AppText variant="caption" tone="secondary">
          Дистанция {dist} · {poly.points.length} точек
        </AppText>
      ) : (
        <AppText variant="caption" tone="secondary">
          {poly.points.length} точек маршрута
        </AppText>
      )}
      {projected ? (
        <View style={styles.mapWrap} accessibilityLabel="Схема GPS-трека">
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            <Polyline
              points={projected.pointsAttr}
              fill="none"
              stroke={colors.ink}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {projected.points[0] ? (
              <Circle cx={projected.points[0].x} cy={projected.points[0].y} r={4} fill={colors.success} />
            ) : null}
            {projected.points[projected.points.length - 1] ? (
              <Circle
                cx={projected.points[projected.points.length - 1]!.x}
                cy={projected.points[projected.points.length - 1]!.y}
                r={4}
                fill={colors.danger}
              />
            ) : null}
          </Svg>
        </View>
      ) : null}
      <AppText variant="caption" tone="muted">
        Зелёная точка — старт, красная — финиш. Схема без подложки карты (офлайн).
      </AppText>
      <View style={styles.btns}>
        {google ? (
          <AppButton
            label="Открыть в Google Maps"
            variant="secondary"
            onPress={() => void Linking.openURL(google)}
          />
        ) : null}
        {yandex ? (
          <AppButton
            label="Открыть в Яндекс.Картах"
            variant="secondary"
            onPress={() => void Linking.openURL(yandex)}
          />
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    marginTop: space.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: H,
  },
  btns: { gap: space.sm, marginTop: space.sm },
});
