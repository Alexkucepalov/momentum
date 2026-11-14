import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { nextIncompleteSetId } from '../../../../../src/domain/strength';
import { RestTimerBar } from '@/src/features/strength/RestTimerBar';
import { SessionFinishSheet } from '@/src/features/strength/SessionFinishSheet';
import { SetLogRow } from '@/src/features/strength/SetLogRow';
import { AppButton, AppText, colors, radius, space } from '@/src/design-system';
import { useActivityRevision, useData } from '@/src/state/DataContext';
import { confirmAction } from '@/src/utils/confirmAction';

const DEFAULT_REST_SEC = 90;

export default function StrengthSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  useActivityRevision();
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);

  const session = id ? repo.getWorkoutSession(String(id)) : null;
  const sets = session ? repo.listWorkoutSets(session.id) : [];
  const currentSetId = nextIncompleteSetId(sets);

  const restByExercise = useMemo(() => {
    const map = new Map<string, number>();
    if (!session?.templateId) return map;
    for (const line of repo.listTemplateExercises(session.templateId)) {
      map.set(line.exerciseId, line.restSec ?? DEFAULT_REST_SEC);
    }
    return map;
  }, [repo, session?.templateId]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') { setRestUntil(null); return; }
    const latest = repo.listWorkoutSets(session.id).filter(s => s.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
    const deadline = latest?.completedAt ? Date.parse(latest.completedAt) + (restByExercise.get(latest.exerciseId) ?? DEFAULT_REST_SEC) * 1000 : null;
    setRestUntil(deadline != null && deadline > Date.now() ? deadline : null);
  }, [id, repo, restByExercise]);

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
      done: rows.filter((r) => r.completed).length,
      total: rows.length,
    }));
  }, [sets, repo]);

  const clearRest = useCallback(() => setRestUntil(null), []);

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
  const progress = total > 0 ? doneCount / total : 0;

  return (
    <View style={styles.root}>
      {restUntil != null && isLive ? (
        <View style={styles.restSticky}>
          <RestTimerBar deadlineMs={restUntil} onSkip={clearRest} onDone={clearRest} />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} testID="strength-session" keyboardShouldPersistTaps="handled">
        <AppText variant="title">{session.title}</AppText>
        <AppText variant="caption" tone="secondary">{new Date(`${session.dateLocal}T12:00:00Z`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</AppText>
        <AppText variant="caption" tone="muted">
          {session.status === 'completed'
            ? session.feelingRpe != null
              ? `Завершена · RPE ${session.feelingRpe}`
              : 'Завершена'
            : session.status === 'abandoned'
              ? 'Прервана'
              : `${doneCount} из ${total || '—'} подходов`}
        </AppText>
        {isLive && total > 0 ? (
          <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Прогресс тренировки" accessibilityValue={{ min: 0, max: total, now: doneCount }} aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        ) : null}
        {session.feelingNote ? (
          <AppText variant="caption" tone="secondary">
            {session.feelingNote}
          </AppText>
        ) : null}

        {groups.map((g) => {
          const groupDone = g.done === g.total && g.total > 0;
          return (
            <View key={g.exerciseId} style={[styles.block, groupDone && styles.blockDone]}>
              <View style={styles.exHead}>
                <AppText variant="subtitle" style={styles.exTitle}>
                  {g.name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {g.done}/{g.total}
                </AppText>
              </View>
              {g.rows.map((s) => (
                <SetLogRow
                  key={s.id}
                  set={s}
                  exerciseName={g.name}
                  isCurrent={s.id === currentSetId}
                  readOnly={!isLive}
                  onComplete={({ weightKg, reps }) => {
                    try {
                      repo.completeWorkoutSet(s.id, { weightKg, reps });
                      refresh('activity');
                      if (!s.completed) setRestUntil(Date.now() + (restByExercise.get(g.exerciseId) ?? DEFAULT_REST_SEC) * 1000);
                    } catch (e) {
                      showFlash(e instanceof Error ? e.message : 'Не удалось записать подход');
                    }
                  }}
                />
              ))}
            </View>
          );
        })}

        {isLive ? (
          <View style={styles.footer}>
            <AppButton
              label={doneCount === total && total > 0 ? 'Завершить · все подходы есть' : 'Завершить тренировку'}
              variant={doneCount === total && total > 0 ? 'primary' : 'secondary'}
              onPress={() => setFinishOpen(true)}
              testID="strength-finish"
            />
            <AppButton
              label="Прервать"
              variant="ghost"
              onPress={() => confirmAction('Прервать тренировку?', 'Записанные подходы сохранятся в истории. Чтобы продолжить позже, можно просто вернуться назад.', { confirmLabel: 'Прервать', destructive: true, onConfirm: () => {
                repo.abandonWorkoutSession(session.id);
                refresh('activity');
                showFlash('Сессия прервана — история подходов сохранена');
                router.back();
              } })}
              testID="strength-abandon"
            />
          </View>
        ) : (
          <AppButton label="Закрыть" variant="secondary" onPress={() => router.back()} />
        )}
      </ScrollView>

      <SessionFinishSheet
        visible={finishOpen}
        title={session.title}
        completedCount={doneCount}
        totalCount={total}
        onClose={() => setFinishOpen(false)}
        onConfirm={({ feelingRpe, feelingNote }) => {
          try {
            repo.completeWorkoutSession(session.id, { feelingRpe, feelingNote });
            setFinishOpen(false);
            refresh('activity');
            showFlash('Тренировка сохранена');
            router.back();
          } catch (e) {
            showFlash(e instanceof Error ? e.message : 'Не удалось завершить');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  restSticky: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: space.screen,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
  },
  block: {
    gap: space.xs,
  },
  blockDone: {
    opacity: 0.7,
  },
  exHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  exTitle: {
    flex: 1,
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
