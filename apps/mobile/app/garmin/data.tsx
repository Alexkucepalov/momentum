import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { AppButton, AppText, space } from '@/src/design-system';
import {
  GarminStepsSection,
  GarminSummaryCard,
  GarminWeightSection,
  GarminWorkoutSection,
} from '@/src/features/garmin/GarminDataLists';
import { useData, useAnyRevision } from '@/src/state/DataContext';

export default function GarminDataScreen() {
  const router = useRouter();
  const { repo } = useData();
  const revision = useAnyRevision();
  void revision;

  const sync = repo.getGarminSyncState();
  const weights = useMemo(() => repo.listIntegratedWeights('garmin', 2000), [repo]);
  const workouts = useMemo(() => repo.listIntegratedWorkouts('garmin', 2000), [repo]);
  const days = useMemo(
    () => repo.listIntegratedDailyActivityStats('garmin', 2000),
    [repo],
  );

  const empty = weights.length === 0 && workouts.length === 0 && days.length === 0;

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <GarminSummaryCard
        weights={weights.length}
        workouts={workouts.length}
        days={days.length}
        lastSuccessfulSyncAt={sync.lastSuccessfulSyncAt}
      />

      {sync.lastError ? (
        <AppText variant="caption" tone="danger" style={styles.warn}>
          Последнее предупреждение sync: {sync.lastError}
        </AppText>
      ) : null}

      {empty ? (
        <AppText variant="body" tone="secondary" style={styles.empty}>
          Пока нет импортированных записей Garmin. Открой подключение и нажми «Полная выгрузка из
          Garmin».
        </AppText>
      ) : null}

      <GarminWeightSection items={weights} />
      <GarminWorkoutSection items={workouts} />
      <GarminStepsSection items={days} />

      <AppButton
        label="К подключению и синхронизации"
        variant="secondary"
        onPress={() => router.push('/garmin' as Href)}
      />

      <AppText variant="caption" tone="muted" style={styles.footnote}>
        Показаны только реально сохранённые поля. Пустые значения Garmin не подменяются нулями.
        Sleep синхронизируется в вкладку «Сон». HRV / body battery — пока вне среза.
      </AppText>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 48, gap: space.md },
  warn: { lineHeight: 18 },
  empty: { lineHeight: 22 },
  footnote: { lineHeight: 18 },
});
