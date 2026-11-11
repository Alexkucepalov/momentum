import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { datesInWeekFromStart, weekStartMonday } from '../../../../../src/domain/habitWeek';
import {
  exerciseWorkingWeightSeries,
  personalRecordsByExercise,
  weekStrengthSummary,
} from '../../../../../src/domain/strength';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';
import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { useAnyRevision, useData } from '@/src/state/DataContext';

export function StrengthProgressPanel({ repo }: { repo: FoodRepository }) {
  const { dateLocal } = useData();
  const revision = useAnyRevision();
  const exercises = useMemo(() => {
    repo.ensureStrengthCatalog();
    return repo.listStrengthExercises();
  }, [repo, revision]);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const activeId =
    exerciseId ?? exercises.find((e) => e.id === 'ex-chest-press')?.id ?? exercises[0]?.id ?? null;

  const weekStart = weekStartMonday(dateLocal);
  const weekDates = useMemo(() => datesInWeekFromStart(weekStart), [weekStart]);

  const snapMeta = useMemo(() => {
    const snap = repo.toSnapshot();
    const plannedStrength = repo
      .listPlannedActivitiesInWeek(weekStart)
      .filter((a) => a.kind === 'strength').length;
    const summary = weekStrengthSummary({
      weekStart,
      weekDates,
      plannedStrengthCount: plannedStrength,
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
    });
    const prs = personalRecordsByExercise({
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
    });
    const series = activeId
      ? exerciseWorkingWeightSeries({
          exerciseId: activeId,
          sessions: snap.workoutSessions,
          sets: snap.workoutSets,
          limit: 12,
        })
      : [];
    return { summary, prs, series };
  }, [repo, revision, weekStart, weekDates, activeId]);

  const selected = exercises.find((e) => e.id === activeId) ?? null;
  const last =
    snapMeta.series.length > 0 ? snapMeta.series[snapMeta.series.length - 1] : null;
  const pr = activeId ? snapMeta.prs.get(activeId) ?? null : null;
  const maxKg = snapMeta.series.reduce<number | null>((acc, p) => {
    if (p.workingWeightKg == null) return acc;
    if (acc == null || p.workingWeightKg > acc) return p.workingWeightKg;
    return acc;
  }, null);

  const { summary } = snapMeta;

  return (
    <AppCard style={styles.card} testID="strength-progress-panel" accessibilityLabel="Прогресс силовых">
      <AppText variant="label" tone="muted">
        Силовые · неделя
      </AppText>
      <AppText variant="body">
        Сессии: {summary.completedSessions}
        {summary.plannedStrength > 0 ? ` / план ${summary.plannedStrength}` : ''}
      </AppText>
      <AppText variant="caption" tone="secondary">
        Объём:{' '}
        {summary.tonnageKg == null
          ? '—'
          : `${Math.round(summary.tonnageKg)} кг·повт.`}
        {summary.incompleteTonnage ? ' · часть подходов без веса' : ''}
      </AppText>

      <AppText variant="label" tone="muted" style={styles.section}>
        Рабочий вес
      </AppText>
      <AppText variant="caption" tone="secondary">
        Без стыда за пропуск — пустая точка не равна 0 кг
      </AppText>

      <View style={styles.chips}>
        {exercises.slice(0, 8).map((e) => {
          const on = e.id === activeId;
          return (
            <Pressable
              key={e.id}
              onPress={() => setExerciseId(e.id)}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={e.name}
            >
              <AppText variant="caption" tone={on ? 'inverse' : 'ink'} numberOfLines={1}>
                {e.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <AppText variant="subtitle">{selected.name}</AppText>
      ) : (
        <AppText variant="body" tone="muted">
          Нет упражнений в каталоге
        </AppText>
      )}

      {pr ? (
        <AppText variant="caption" tone="secondary">
          Рекорд: {pr.weightKg} кг × {pr.reps} · {pr.dateLocal}
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted">
          Рекорд появится после подхода с весом
        </AppText>
      )}

      {last?.workingWeightKg != null ? (
        <AppText variant="body">
          Последний: {last.workingWeightKg} кг
          {last.topReps != null ? ` × ${last.topReps}` : ''}
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted">
          Пока нет завершённых подходов с весом
        </AppText>
      )}

      <View style={styles.bars} accessibilityLabel="Рабочий вес по сессиям">
        {snapMeta.series.length === 0 ? (
          <AppText variant="caption" tone="muted" style={styles.emptyChart}>
            Запиши силовую — появится ряд
          </AppText>
        ) : (
          snapMeta.series.map((p) => {
            const h =
              p.workingWeightKg == null || maxKg == null || maxKg <= 0
                ? 4
                : Math.max(8, Math.round((p.workingWeightKg / maxKg) * 72));
            return (
              <View key={p.sessionId} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    { height: h },
                    p.workingWeightKg == null && styles.barUnknown,
                  ]}
                  accessibilityLabel={
                    p.workingWeightKg == null
                      ? `${p.dateLocal}: вес неизвестен`
                      : `${p.dateLocal}: ${p.workingWeightKg} кг`
                  }
                />
              </View>
            );
          })
        )}
      </View>
      <AppText variant="caption" tone="muted">
        Пустой столбик — вес не записан, не «0 кг».
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  section: { marginTop: space.xs },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  chip: {
    maxWidth: '48%',
    minHeight: touchMin - 12,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  bars: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: space.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    backgroundColor: colors.chartFill,
    minHeight: 4,
  },
  barUnknown: {
    backgroundColor: colors.chartTrack,
  },
  emptyChart: {
    padding: space.md,
  },
  pressed: { opacity: 0.85 },
});
