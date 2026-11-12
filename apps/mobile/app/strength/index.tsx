import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  strengthSessionHref,
  strengthTemplateHref,
} from '@/src/features/strength/StrengthEntryCard';
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

  const createBlankTemplate = () => {
    try {
      const created = repo.createWorkoutTemplate({
        name: 'Новый шаблон',
        subtitle: null,
        exercises: [],
      });
      refresh('activity');
      router.push(strengthTemplateHref(created.id));
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Не удалось создать шаблон');
    }
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

      <View style={styles.sectionRow}>
        <AppText variant="label" tone="muted">
          Шаблоны
        </AppText>
        <AppButton
          label="Новый шаблон"
          variant="secondary"
          onPress={createBlankTemplate}
          testID="hub-new-template"
        />
      </View>
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
              <View style={styles.actions}>
                <AppButton
                  label="Начать"
                  onPress={() => startTemplate(t.id)}
                  testID={`hub-start-${t.id}`}
                />
                <AppButton
                  label="Изменить"
                  variant="secondary"
                  onPress={() => router.push(strengthTemplateHref(t.id))}
                  testID={`hub-edit-${t.id}`}
                />
              </View>
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
  sectionRow: {
    marginTop: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  list: {
    gap: space.md,
  },
  card: {
    gap: space.sm,
  },
  actions: {
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
