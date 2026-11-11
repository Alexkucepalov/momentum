import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { strengthSessionHref } from '@/src/features/strength/StrengthEntryCard';
import { AppButton, AppCard, AppText, colors, space } from '@/src/design-system';
import { useActivityRevision, useData } from '@/src/state/DataContext';

export default function StrengthHubScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  useActivityRevision();

  useEffect(() => {
    const before = repo.listWorkoutTemplates().length;
    repo.ensureStrengthCatalog();
    if (repo.listWorkoutTemplates().length !== before) refresh('activity');
  }, [repo, refresh]);
  const templates = repo.listWorkoutTemplates();
  const inProgress = repo.listInProgressWorkoutSessions();

  const startTemplate = (templateId: string) => {
    const tmpl = repo.getWorkoutTemplate(templateId);
    if (!tmpl) {
      showFlash('Шаблон не найден');
      return;
    }
    const session = repo.startWorkoutSession({
      dateLocal,
      title: tmpl.name,
      templateId: tmpl.id,
    });
    refresh('activity');
    showFlash('Сессия начата');
    router.push(strengthSessionHref(session.id));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} testID="strength-hub">
      {inProgress.map((s) => (
        <AppCard key={s.id} style={styles.activeCard}>
          <AppText variant="label" tone="muted">
            Черновик
          </AppText>
          <AppText variant="subtitle">{s.title}</AppText>
          <AppText variant="caption" tone="muted">
            Можно продолжить после перезапуска
          </AppText>
          <AppButton
            label="Продолжить"
            onPress={() => router.push(strengthSessionHref(s.id))}
            testID={`hub-continue-${s.id}`}
          />
        </AppCard>
      ))}

      <AppText variant="label" tone="muted" style={styles.section}>
        Шаблоны
      </AppText>
      <View style={styles.list}>
        {templates.map((t) => {
          const lines = repo.listTemplateExercises(t.id);
          return (
            <AppCard key={t.id} style={styles.card}>
              <AppText variant="subtitle">{t.name}</AppText>
              {t.subtitle ? (
                <AppText variant="caption" tone="muted">
                  {t.subtitle}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {lines.length} упр. · {lines.reduce((sum, l) => sum + l.targetSets, 0)} подходов
              </AppText>
              <AppButton
                label="Начать"
                onPress={() => startTemplate(t.id)}
                testID={`hub-start-${t.id}`}
              />
              <View style={styles.preview}>
                {lines.slice(0, 4).map((l) => {
                  const ex = repo.getStrengthExercise(l.exerciseId);
                  const reps =
                    l.targetRepsMin != null && l.targetRepsMax != null
                      ? `${l.targetRepsMin}–${l.targetRepsMax}`
                      : String(l.targetRepsMin ?? l.targetRepsMax ?? '—');
                  return (
                    <AppText key={l.id} variant="caption" tone="muted">
                      · {ex?.name ?? l.exerciseId} · {l.targetSets}×{reps}
                    </AppText>
                  );
                })}
              </View>
            </AppCard>
          );
        })}
      </View>

      {templates.length === 0 ? (
        <Pressable
          onPress={() => {
            repo.ensureStrengthCatalog();
            refresh('activity');
          }}
          style={styles.empty}
          accessibilityRole="button"
          accessibilityLabel="Загрузить каталог"
        >
          <Ionicons name="barbell-outline" size={28} color={colors.textMuted} />
          <AppText variant="body" tone="muted">
            Каталог пуст — нажми, чтобы загрузить шаблоны
          </AppText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
  },
  activeCard: {
    gap: space.sm,
  },
  section: {
    marginTop: space.sm,
  },
  list: {
    gap: space.md,
  },
  card: {
    gap: space.sm,
  },
  preview: {
    gap: 2,
  },
  empty: {
    alignItems: 'center',
    gap: space.sm,
    padding: space.xl,
  },
});
