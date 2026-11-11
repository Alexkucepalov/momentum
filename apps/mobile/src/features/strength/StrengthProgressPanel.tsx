import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { exerciseWorkingWeightSeries } from '../../../../../src/domain/strength';
import type { FoodRepository } from '../../../../../src/storage/foodRepository';
import { AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { useAnyRevision } from '@/src/state/DataContext';

export function StrengthProgressPanel({ repo }: { repo: FoodRepository }) {
  const revision = useAnyRevision();
  const exercises = useMemo(() => {
    repo.ensureStrengthCatalog();
    return repo.listStrengthExercises();
  }, [repo, revision]);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const activeId =
    exerciseId ?? exercises.find((e) => e.id === 'ex-chest-press')?.id ?? exercises[0]?.id ?? null;

  const series = useMemo(() => {
    if (!activeId) return [];
    const snap = repo.toSnapshot();
    return exerciseWorkingWeightSeries({
      exerciseId: activeId,
      sessions: snap.workoutSessions,
      sets: snap.workoutSets,
      limit: 12,
    });
  }, [repo, activeId, revision]);

  const selected = exercises.find((e) => e.id === activeId) ?? null;
  const last = series.length > 0 ? series[series.length - 1] : null;
  const maxKg = series.reduce<number | null>((acc, p) => {
    if (p.workingWeightKg == null) return acc;
    if (acc == null || p.workingWeightKg > acc) return p.workingWeightKg;
    return acc;
  }, null);

  return (
    <AppCard style={styles.card} testID="strength-progress-panel" accessibilityLabel="Прогресс силовых">
      <AppText variant="label" tone="muted">
        Силовые · рабочий вес
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

      <AppText variant="label" tone="muted">
        Рабочий вес по сессиям
      </AppText>
      <View style={styles.bars} accessibilityLabel="Рабочий вес по сессиям">
        {series.length === 0 ? (
          <AppText variant="caption" tone="muted" style={styles.emptyChart}>
            Запиши силовую — появится ряд
          </AppText>
        ) : (
          series.map((p) => {
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
