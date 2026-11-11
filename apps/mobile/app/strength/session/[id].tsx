import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SetLogRow } from '@/src/features/strength/SetLogRow';
import { AppButton, AppText, colors, space } from '@/src/design-system';
import { useActivityRevision, useData } from '@/src/state/DataContext';

export default function StrengthSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  useActivityRevision();

  const session = id ? repo.getWorkoutSession(String(id)) : null;
  const sets = session ? repo.listWorkoutSets(session.id) : [];

  const groups = useMemo(() => {
    const map = new Map<string, typeof sets>();
    for (const s of sets) {
      const list = map.get(s.exerciseId) ?? [];
      list.push(s);
      map.set(s.exerciseId, list);
    }
    return [...map.entries()].map(([exerciseId, rows]) => ({
      exerciseId,
      name: repo.getStrengthExercise(exerciseId)?.name ?? exerciseId,
      rows: rows.sort((a, b) => a.setIndex - b.setIndex),
    }));
  }, [sets, repo]);

  if (!session) {
    return (
      <View style={styles.missing}>
        <AppText variant="body" tone="muted">
          Сессия не найдена
        </AppText>
        <AppButton label="Назад" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const doneCount = sets.filter((s) => s.completed).length;
  const total = sets.length;
  const isLive = session.status === 'in_progress';

  return (
    <ScrollView contentContainerStyle={styles.content} testID="strength-session">
      <AppText variant="title">{session.title}</AppText>
      <AppText variant="caption" tone="muted">
        {session.status === 'completed'
          ? 'Завершена'
          : session.status === 'abandoned'
            ? 'Прервана'
            : `В процессе · ${doneCount}/${total || '—'} подходов`}
      </AppText>

      {groups.map((g) => (
        <View key={g.exerciseId} style={styles.block}>
          <AppText variant="subtitle" style={styles.exTitle}>
            {g.name}
          </AppText>
          {g.rows.map((s) => (
            <SetLogRow
              key={s.id}
              set={s}
              exerciseName={g.name}
              onComplete={({ weightKg, reps }) => {
                try {
                  repo.completeWorkoutSet(s.id, { weightKg, reps });
                  refresh('activity');
                } catch (e) {
                  showFlash(e instanceof Error ? e.message : 'Не удалось записать подход');
                }
              }}
            />
          ))}
        </View>
      ))}

      {isLive ? (
        <View style={styles.footer}>
          <AppButton
            label="Завершить тренировку"
            onPress={() => {
              repo.completeWorkoutSession(session.id);
              refresh('activity');
              showFlash('Тренировка сохранена');
              router.back();
            }}
            testID="strength-finish"
          />
          <AppButton
            label="Прервать"
            variant="ghost"
            onPress={() => {
              repo.abandonWorkoutSession(session.id);
              refresh('activity');
              showFlash('Сессия прервана — история подходов сохранена');
              router.back();
            }}
            testID="strength-abandon"
          />
        </View>
      ) : (
        <AppButton label="Закрыть" variant="secondary" onPress={() => router.back()} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  block: {
    gap: space.xs,
  },
  exTitle: {
    marginBottom: space.xs,
  },
  footer: {
    gap: space.sm,
    marginTop: space.md,
  },
  missing: {
    flex: 1,
    padding: space.lg,
    gap: space.md,
    justifyContent: 'center',
  },
});
