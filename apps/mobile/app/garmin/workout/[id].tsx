import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import type { WorkoutType } from '../../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { AppCard, AppText, space } from '@/src/design-system';
import { GarminRawFields } from '@/src/features/garmin/GarminRawFields';
import { HrZonesBar } from '@/src/features/garmin/HrZonesBar';
import { TrackMapCard } from '@/src/features/garmin/TrackMapCard';
import { WorkoutChartCard } from '@/src/features/garmin/WorkoutChartCard';
import { useData } from '@/src/state/DataContext';

const TYPE_RU: Record<WorkoutType, string> = {
  walking: 'Ходьба / бег',
  cycling: 'Велоспорт',
  strength: 'Сила',
  football: 'Футбол',
  other: 'Другое',
};

function fmt(n: number | null | undefined, digits = 0, suffix = ''): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${digits > 0 ? n.toFixed(digits) : Math.round(n)}${suffix}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText variant="subtitle">{value}</AppText>
    </View>
  );
}

export default function GarminWorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { repo, revision } = useData();
  void revision;

  const workout = id ? repo.getWorkoutById(String(id)) : null;

  if (!workout) {
    return (
      <View style={styles.missing}>
        <AppText variant="body">Тренировка не найдена</AppText>
      </View>
    );
  }

  const mins = Math.round(workout.durationSec / 60);
  const distKm =
    workout.distanceM != null ? `${(workout.distanceM / 1000).toFixed(2)} км` : '—';
  const avgSpeed =
    workout.avgSpeedMps != null ? `${(workout.avgSpeedMps * 3.6).toFixed(1)} км/ч` : '—';
  const maxSpeed =
    workout.maxSpeedMps != null ? `${(workout.maxSpeedMps * 3.6).toFixed(1)} км/ч` : '—';
  const showCycling =
    workout.type === 'cycling' ||
    workout.avgPowerW != null ||
    workout.maxPowerW != null ||
    workout.normalizedPowerW != null;

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <AppCard>
        <AppText variant="label" tone="secondary">
          {TYPE_RU[workout.type]} · {workout.dateLocal}
        </AppText>
        <AppText variant="title">{workout.notes?.trim() || TYPE_RU[workout.type]}</AppText>
        <AppText variant="caption" tone="muted">
          {workout.source === 'garmin' ? 'Garmin' : 'Вручную'}
          {workout.externalId ? ` · ${workout.externalId}` : ''}
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Основные</AppText>
        <View style={styles.grid}>
          <Metric label="Длительность" value={`${mins} мин`} />
          <Metric label="Дистанция" value={distKm} />
          <Metric label="Калории" value={fmt(workout.calories, 0, ' ккал')} />
          <Metric
            label="В движении"
            value={
              workout.movingDurationSec != null
                ? `${Math.round(workout.movingDurationSec / 60)} мин`
                : '—'
            }
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle">Пульс</AppText>
        <View style={styles.grid}>
          <Metric label="Средний" value={fmt(workout.avgHeartRate, 0, ' уд/м')} />
          <Metric label="Макс" value={fmt(workout.maxHeartRate, 0, ' уд/м')} />
        </View>
        <HrZonesBar zones={workout.hrZones} />
      </AppCard>

      {showCycling ? (
        <AppCard>
          <AppText variant="subtitle">Вело / мощность</AppText>
          <View style={styles.grid}>
            <Metric label="Ср. мощность" value={fmt(workout.avgPowerW, 0, ' Вт')} />
            <Metric label="Макс мощность" value={fmt(workout.maxPowerW, 0, ' Вт')} />
            <Metric label="NP" value={fmt(workout.normalizedPowerW, 0, ' Вт')} />
            <Metric label="Каденс" value={fmt(workout.avgCadence, 0, ' rpm')} />
            <Metric label="Ср. скорость" value={avgSpeed} />
            <Metric label="Макс скорость" value={maxSpeed} />
            <Metric label="Набор высоты" value={fmt(workout.elevationGainM, 0, ' м')} />
          </View>
        </AppCard>
      ) : null}

      <TrackMapCard polylineJson={workout.polylineJson} distanceM={workout.distanceM} />
      <WorkoutChartCard chartJson={workout.chartJson} />
      <GarminRawFields detailJson={workout.detailJson} />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: space.md },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  metric: { width: '45%', gap: 2 },
});
