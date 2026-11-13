import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AddExerciseToTemplateSheet } from '@/src/features/strength/AddExerciseToTemplateSheet';
import { CreateExerciseSheet } from '@/src/features/strength/CreateExerciseSheet';
import { AppButton, AppText, Field, colors, radius, space, touchMin } from '@/src/design-system';
import { useActivityRevision, useData } from '@/src/state/DataContext';
import { confirmAction } from '@/src/utils/confirmAction';

type DraftLine = {
  key: string;
  exerciseId: string;
  targetSets: string;
  targetRepsMin: string;
  targetRepsMax: string;
  restSec: string;
  notes: string;
};

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  useActivityRevision();

  const templateId = String(id ?? '');
  const template = templateId ? repo.getWorkoutTemplate(templateId) : null;
  const exercises = repo.listStrengthExercises();

  const [name, setName] = useState(template?.name ?? '');
  const [subtitle, setSubtitle] = useState(template?.subtitle ?? '');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setSubtitle(template.subtitle ?? '');
    const rows = repo.listTemplateExercises(template.id).map((l) => ({
      key: l.id,
      exerciseId: l.exerciseId,
      targetSets: String(l.targetSets),
      targetRepsMin: l.targetRepsMin != null ? String(l.targetRepsMin) : '',
      targetRepsMax: l.targetRepsMax != null ? String(l.targetRepsMax) : '',
      restSec: l.restSec != null ? String(l.restSec) : '90',
      notes: l.notes ?? '',
    }));
    setLines(rows);
    setDirty(false);
  }, [template?.id, repo]);

  const excludeIds = useMemo(() => new Set(lines.map((l) => l.exerciseId)), [lines]);

  if (!template) {
    return (
      <View style={styles.missing}>
        <AppText variant="body" tone="muted">
          Шаблон не найден
        </AppText>
        <AppButton label="Назад" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  const moveLine = (key: string, direction: 'up' | 'down') => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx]!;
      next[idx] = next[swap]!;
      next[swap] = tmp;
      return next;
    });
    setDirty(true);
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
    setDirty(true);
  };

  const addExercise = (exerciseId: string) => {
    setLines((prev) => [
      ...prev,
      {
        key: `new-${exerciseId}-${prev.length}`,
        exerciseId,
        targetSets: '2',
        targetRepsMin: '8',
        targetRepsMax: '12',
        restSec: '90',
        notes: '',
      },
    ]);
    setDirty(true);
    setAddOpen(false);
    setCreateOpen(false);
  };

  const save = () => {
    try {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Введи название шаблона');
      const payload = lines.map((l) => {
        const sets = Number(l.targetSets.replace(',', '.'));
        if (!Number.isFinite(sets) || sets < 1) throw new Error('Подходы: целое ≥ 1');
        const repsMin = l.targetRepsMin.trim() === '' ? null : Number(l.targetRepsMin.replace(',', '.'));
        const repsMax = l.targetRepsMax.trim() === '' ? null : Number(l.targetRepsMax.replace(',', '.'));
        const rest = l.restSec.trim() === '' ? null : Number(l.restSec.replace(',', '.'));
        if (repsMin != null && (!Number.isFinite(repsMin) || repsMin < 0)) {
          throw new Error('Повторы мин: число ≥ 0 или пусто');
        }
        if (repsMax != null && (!Number.isFinite(repsMax) || repsMax < 0)) {
          throw new Error('Повторы макс: число ≥ 0 или пусто');
        }
        if (rest != null && (!Number.isFinite(rest) || rest < 0)) {
          throw new Error('Отдых: секунды ≥ 0 или пусто');
        }
        return {
          exerciseId: l.exerciseId,
          targetSets: Math.round(sets),
          targetRepsMin: repsMin,
          targetRepsMax: repsMax,
          restSec: rest == null ? null : Math.round(rest),
          notes: l.notes.trim() ? l.notes.trim() : null,
        };
      });
      repo.updateWorkoutTemplate(template.id, {
        name: trimmed,
        subtitle: subtitle.trim() ? subtitle.trim() : null,
      });
      repo.setTemplateExercises(template.id, payload);
      refresh('activity');
      setDirty(false);
      showFlash('Шаблон сохранён');
      // Reload keys from persisted ids
      const rows = repo.listTemplateExercises(template.id).map((l) => ({
        key: l.id,
        exerciseId: l.exerciseId,
        targetSets: String(l.targetSets),
        targetRepsMin: l.targetRepsMin != null ? String(l.targetRepsMin) : '',
        targetRepsMax: l.targetRepsMax != null ? String(l.targetRepsMax) : '',
        restSec: l.restSec != null ? String(l.restSec) : '',
        notes: l.notes ?? '',
      }));
      setLines(rows);
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="template-editor"
      >
        <Field label="Название" value={name} onChangeText={(v) => { setName(v); setDirty(true); }} />
        <Field
          label="Подзаголовок"
          value={subtitle}
          onChangeText={(v) => { setSubtitle(v); setDirty(true); }}
          placeholder="например: Грудь и спина · 19:30"
        />

        <View style={styles.sectionHead}>
          <AppText variant="label" tone="muted">
            Упражнения · {lines.length}
          </AppText>
          <Pressable
            onPress={() => setAddOpen(true)}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Добавить упражнение"
            testID="template-add-exercise"
          >
            <Ionicons name="add" size={20} color={colors.ink} />
            <AppText variant="caption">Добавить</AppText>
          </Pressable>
        </View>

        {lines.length === 0 ? (
          <AppText variant="caption" tone="muted">
            Пока пусто — добавь упражнения из каталога или создай новые.
          </AppText>
        ) : null}

        {lines.map((l, index) => {
          const ex = repo.getStrengthExercise(l.exerciseId);
          return (
            <View key={l.key} style={styles.lineCard} testID={`template-line-${l.key}`}>
              <View style={styles.lineTop}>
                <AppText variant="body" style={styles.lineTitle}>
                  {index + 1}. {ex?.name ?? l.exerciseId}
                </AppText>
                <View style={styles.orderBtns}>
                  <Pressable
                    onPress={() => moveLine(l.key, 'up')}
                    disabled={index === 0}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      index === 0 && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Выше"
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveLine(l.key, 'down')}
                    disabled={index === lines.length - 1}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      index === lines.length - 1 && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Ниже"
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      confirmAction('Убрать упражнение?', 'Из шаблона, не из истории тренировок.', {
                        confirmLabel: 'Убрать',
                        destructive: true,
                        onConfirm: () => removeLine(l.key),
                      })
                    }
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Убрать"
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.fieldsRow}>
                <View style={styles.fieldGrow}>
                  <Field
                    label="подх."
                    value={l.targetSets}
                    onChangeText={(v) => updateLine(l.key, { targetSets: v })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldGrow}>
                  <Field
                    label="повт. от"
                    value={l.targetRepsMin}
                    onChangeText={(v) => updateLine(l.key, { targetRepsMin: v })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldGrow}>
                  <Field
                    label="до"
                    value={l.targetRepsMax}
                    onChangeText={(v) => updateLine(l.key, { targetRepsMax: v })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldGrow}>
                  <Field
                    label="отдых с"
                    value={l.restSec}
                    onChangeText={(v) => updateLine(l.key, { restSec: v })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          );
        })}

        <AppButton
          label={dirty ? 'Сохранить изменения' : 'Сохранено'}
          onPress={save}
          disabled={!dirty}
          testID="template-save"
        />
        <AppButton
          label="Удалить шаблон"
          variant="ghost"
          onPress={() => {
            Alert.alert('Удалить шаблон?', 'План на неделе и история сессий не сотрутся.', [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Удалить',
                style: 'destructive',
                onPress: () => {
                  repo.softDeleteWorkoutTemplate(template.id);
                  refresh('activity');
                  showFlash('Шаблон удалён');
                  router.back();
                },
              },
            ]);
          }}
        />
      </ScrollView>

      <AddExerciseToTemplateSheet
        visible={addOpen}
        exercises={exercises}
        excludeIds={excludeIds}
        onClose={() => setAddOpen(false)}
        onPick={addExercise}
        onCreateNew={() => {
          setAddOpen(false);
          setCreateOpen(true);
        }}
      />
      <CreateExerciseSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(input) => {
          try {
            const created = repo.createStrengthExercise(input);
            refresh('activity');
            addExercise(created.id);
            showFlash('Упражнение создано');
          } catch (e) {
            showFlash(e instanceof Error ? e.message : 'Не удалось создать');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: touchMin,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lineCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
    gap: space.xs,
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  lineTitle: { flex: 1, fontWeight: '600' },
  orderBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
  },
  disabled: { opacity: 0.35 },
  fieldsRow: { flexDirection: 'row', gap: space.xs },
  fieldGrow: { flex: 1 },
  missing: { flex: 1, padding: space.lg, gap: space.md, justifyContent: 'center' },
  pressed: { opacity: 0.85 },
});
