import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

import { buildHabitWeekMarks } from '../../../../../src/domain/habitWeek';
import type { FlexibleHabit, HabitAutoSource, HabitKind } from '../../../../../src/storage/types';
import { EmptyState } from '../../components/EmptyState';
import { useData, useAnyRevision } from '../../state/DataContext';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { HabitCard } from './HabitCard';
import { HabitFormFields } from './HabitFormFields';
import { confirmAction } from '@/src/utils/confirmAction';
import { HabitDayValueSheet } from './HabitDayValueSheet';
import { AppButton } from '@/src/design-system';

const emptyForm = {
  name: '',
  times: 3,
  kind: 'checkbox' as HabitKind,
  unit: 'мин',
  targetValue: '30',
  autoSource: null as HabitAutoSource,
};

export function FlexibleHabitsPanel() {
  const { repo, dateLocal, refresh, showFlash, setUndo } = useData();
  const revision = useAnyRevision();
  void revision;
  const [quantityHabit, setQuantityHabit] = useState<FlexibleHabit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [composerOpen, setComposerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState(emptyForm);
  const habits = repo.listFlexibleHabits();

  const parseTarget = (raw: string): number | null => {
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const create = () => {
    try {
      setError(null);
      const habit = repo.createFlexibleHabit(form.name, form.times, {
        kind: form.kind,
        unit: form.kind === 'quantity' ? form.unit : null,
        targetValue: form.kind === 'quantity' ? parseTarget(form.targetValue) : null,
        autoSource: form.autoSource,
      });
      setForm(emptyForm);
      setComposerOpen(false);
      refresh();
      setUndo({ message: `Привычка «${habit.name}» добавлена`, action: () => repo.softDeleteFlexibleHabit(habit.id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не создано');
    }
  };

  const startEdit = (id: string) => {
    const h = habits.find((x) => x.id === id);
    if (!h) return;
    setEditingId(id);
    setEdit({
      name: h.name,
      times: h.timesPerWeek,
      kind: h.kind,
      unit: h.unit ?? 'мин',
      targetValue: h.targetValue != null ? String(h.targetValue) : '30',
      autoSource: h.autoSource,
    });
    setError(null);
    setComposerOpen(false);
  };

  const saveEdit = () => {
    if (!editingId) return;
    try {
      setError(null);
      const previous = habits.find(h => h.id === editingId)!;
      const updated = repo.updateFlexibleHabit(editingId, {
        name: edit.name,
        timesPerWeek: edit.times,
        kind: edit.kind,
        unit: edit.kind === 'quantity' ? edit.unit : null,
        targetValue: edit.kind === 'quantity' ? parseTarget(edit.targetValue) : null,
        autoSource: edit.autoSource,
      });
      setEditingId(null);
      refresh();
      setUndo({ message: `Обновлено: ${updated.name}`, action: () => repo.updateFlexibleHabit(previous.id, { ...previous }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  const remove = (id: string, habitName: string) => {
    confirmAction('Удалить привычку?', `«${habitName}» пропадёт из списка. Отметки за прошлые дни останутся на устройстве.`, {
      confirmLabel: 'Удалить', destructive: true, onConfirm: () => {
        try {
          repo.softDeleteFlexibleHabit(id);
          if (editingId === id) setEditingId(null);
          refresh('diary');
          setUndo({ message: `Удалено: ${habitName}`, action: () => repo.restoreFlexibleHabit(id) });
        } catch (e) { setError(e instanceof Error ? e.message : 'Не удалено'); }
      },
    });
  };

  const pause = (id: string, habitName: string, paused: boolean) => {
    try {
      repo.updateFlexibleHabit(id, { paused });
      refresh('diary');
      setUndo({ message: paused ? `Пауза: ${habitName}` : `Снова в списке: ${habitName}`, action: () => repo.updateFlexibleHabit(id, { paused: !paused }) });
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось'); }
  };

  const saveDayValue = (habit: FlexibleHabit, value: number) => {
    const day = dateLocal;
    const previous = repo.flexibleHabitDayValue(habit.id, day);
    repo.setFlexibleHabitDayValue(habit.id, day, value);
    refresh('diary');
    setUndo({ message: `Обновлён день: ${habit.name}`, action: () => repo.setFlexibleHabitDayValue(habit.id, day, previous) });
  };
  const toggle = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    try {
      saveDayValue(habit, repo.isFlexibleHabitLogged(id, dateLocal) ? 0 : 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось изменить день'); }
  };

  return (
    <View style={styles.wrap}>
      <HabitDayValueSheet habit={quantityHabit} value={quantityHabit ? repo.flexibleHabitDayValue(quantityHabit.id, dateLocal) : 0} onClose={() => setQuantityHabit(null)} onSave={value => {
        if (!quantityHabit) return;
        saveDayValue(quantityHabit, value);
        setQuantityHabit(null);
      }} />
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="checkbox-outline" size={20} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heading} accessibilityRole="header">
            Привычки
          </Text>
          <Text style={styles.sub}>
            Отмечай дни или суммируй минуты/раз. Без серий и штрафов — пропуск ничего не ломает.
          </Text>
        </View>
      </View>

      {habits.length === 0 && !composerOpen ? (
        <EmptyState
          icon="checkbox-outline"
          title="Пока нет привычек"
          body="Задай мягкую цель — дни или сумму (минуты, страницы). Отмечай на Сегодня или здесь."
          actionLabel="Добавить привычку"
          onAction={() => {
            setComposerOpen(true);
            setError(null);
          }}
        />
      ) : null}

      {habits.map((h) => {
        const stats = repo.flexibleHabitWeekStats(h.id, dateLocal);
        const marks = buildHabitWeekMarks({
          dateLocal,
          isLogged: (day) => repo.isFlexibleHabitLogged(h.id, day),
        });
        const isPaused = h.pausedAt != null;
        return (
          <HabitCard
            key={h.id}
            name={isPaused ? `${h.name} · пауза` : h.name}
            kind={h.kind}
            unit={h.unit}
            completed={stats.completed}
            target={stats.target}
            loggedToday={repo.isFlexibleHabitLogged(h.id, dateLocal)}
            marks={marks}
            editing={editingId === h.id}
            editName={edit.name}
            editTimes={edit.times}
            editKind={edit.kind}
            editUnit={edit.unit}
            editTargetValue={edit.targetValue}
            editAutoSource={edit.autoSource}
            onChangeEditName={(t) => setEdit((s) => ({ ...s, name: t }))}
            onChangeEditTimes={(n) => setEdit((s) => ({ ...s, times: n }))}
            onChangeEditKind={(k) => setEdit((s) => ({ ...s, kind: k }))}
            onChangeEditUnit={(t) => setEdit((s) => ({ ...s, unit: t }))}
            onChangeEditTargetValue={(t) => setEdit((s) => ({ ...s, targetValue: t }))}
            onChangeEditAutoSource={(s) => setEdit((prev) => ({ ...prev, autoSource: s }))}
            onToggleToday={() => toggle(h.id)}
            onAddQuantity={() => setQuantityHabit(h)}
            dayLabel={dateLocal}
            paused={isPaused}
            onStartEdit={() => startEdit(h.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={saveEdit}
            onDelete={() => remove(h.id, h.name)}
            onPause={() => pause(h.id, h.name, !isPaused)}
          />
        );
      })}

      {composerOpen ? (
        <View style={styles.composer}>
          <Text style={styles.composerTitle}>Новая привычка</Text>
          <HabitFormFields
            name={form.name}
            times={form.times}
            kind={form.kind}
            unit={form.unit}
            targetValue={form.targetValue}
            autoSource={form.autoSource}
            onChangeName={(t) => setForm((s) => ({ ...s, name: t }))}
            onChangeTimes={(n) => setForm((s) => ({ ...s, times: n }))}
            onChangeKind={(k) => setForm((s) => ({ ...s, kind: k }))}
            onChangeUnit={(t) => setForm((s) => ({ ...s, unit: t }))}
            onChangeTargetValue={(t) => setForm((s) => ({ ...s, targetValue: t }))}
            onChangeAutoSource={(s) => setForm((prev) => ({ ...prev, autoSource: s }))}
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
          <View style={styles.composerActions}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => {
                setComposerOpen(false);
                setError(null);
                setForm(emptyForm);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>Отмена</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppButton label="Добавить" onPress={create} />
            </View>
          </View>
        </View>
      ) : habits.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          onPress={() => {
            setComposerOpen(true);
            setEditingId(null);
            setError(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Добавить привычку"
        >
          <Ionicons name="add" size={20} color={colors.text} />
          <Text style={styles.addRowText}>Ещё привычка</Text>
        </Pressable>
      ) : null}

      {error && !composerOpen ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  hero: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.lg,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heading: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  sub: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  composer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  composerTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.md,
  },
  composerActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md, alignItems: 'center' },
  secondaryBtn: {
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontWeight: '700', color: colors.text },
  addRow: {
    minHeight: touchMin,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  addRowText: { fontWeight: '700', color: colors.text, fontSize: type.body },
  error: { color: colors.danger, marginBottom: space.sm, fontSize: type.caption },
  pressed: { opacity: 0.88 },
});
