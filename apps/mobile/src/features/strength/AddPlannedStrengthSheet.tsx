import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlannedActivity, PlannedActivityKind, WorkoutTemplate } from '../../../../../src/domain/strength/types';
import { assertLocalTime } from '../../../../../src/storage/validation';
import { SwipeToDismissSheet } from '@/src/components/SwipeToDismissSheet';
import { AppButton, AppText, Field, SegmentedControl, colors, radius, space, touchMin } from '@/src/design-system';

export type TrainingPlanInput = Pick<PlannedActivity, 'kind' | 'title' | 'subtitle' | 'templateId' | 'timeLocal' | 'cardioMinutes'>;
export function AddPlannedStrengthSheet({ visible, dateLabel, templates, activity, onClose, onSave }: {
  visible: boolean; dateLabel: string; templates: WorkoutTemplate[]; activity?: PlannedActivity | null;
  onClose: () => void; onSave: (input: TrainingPlanInput) => void;
}) {
  const [kind, setKind] = useState<PlannedActivityKind>('strength');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const firstId = templates[0]?.id;
  useEffect(() => {
    if (!visible) return;
    setKind(activity?.kind ?? 'strength'); setTemplateId(activity?.templateId ?? firstId ?? null);
    setTitle(activity?.title ?? templates[0]?.name ?? 'Силовая');
    setTime(activity?.timeLocal ?? ''); setMinutes(String(activity?.cardioMinutes ?? 30));
    setNote(activity?.subtitle ?? ''); setError(null);
  }, [visible, activity, firstId]);
  const chooseKind = (value: PlannedActivityKind) => {
    setKind(value); setError(null);
    setTitle(value === 'strength' ? templates.find(t => t.id === templateId)?.name ?? 'Силовая' : value === 'cardio' ? 'Велотренировка' : 'Отдых');
    setNote('');
  };
  const save = () => {
    try {
      if (!title.trim()) throw new Error('Добавь название тренировки');
      const timeLocal = time.trim() || null;
      assertLocalTime(timeLocal);
      let cardioMinutes: number | null = null;
      if (kind === 'cardio' && minutes.trim()) {
        cardioMinutes = Number(minutes.trim());
        if (!Number.isInteger(cardioMinutes) || cardioMinutes <= 0 || cardioMinutes > 1440) throw new Error('Длительность — целое число от 1 до 1440 минут');
      }
      if (kind === 'strength' && (!templateId || !templates.some(t => t.id === templateId))) throw new Error('Выбери шаблон силовой тренировки');
      onSave({ kind, title: title.trim(), subtitle: note.trim() || null, templateId: kind === 'strength' ? templateId : null, timeLocal, cardioMinutes });
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить план'); }
  };
  return <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.94} testID="add-planned-strength-sheet">
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.head}><View style={styles.heading}><AppText variant="title">{activity ? 'Изменить план' : 'Новая тренировка'}</AppText><AppText variant="caption" tone="secondary">{dateLabel} · план на день</AppText></View><Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Закрыть планирование"><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
      {!activity ? <SegmentedControl<PlannedActivityKind> value={kind} onChange={chooseKind} accessibilityLabel="Вид тренировки" options={[{ id: 'strength', label: 'Силовая' }, { id: 'cardio', label: 'Вело' }, { id: 'rest', label: 'Отдых' }]} /> : null}
      {kind === 'strength' ? <View style={styles.templates} accessibilityRole="radiogroup" accessibilityLabel="Шаблон силовой тренировки">
        <AppText variant="label" tone="muted">Шаблон упражнений</AppText>
        {templates.map(t => <Pressable key={t.id} onPress={() => { setTemplateId(t.id); setTitle(t.name); setNote(t.subtitle ?? ''); }} accessibilityRole="radio" accessibilityState={{ checked: templateId === t.id }} aria-checked={templateId === t.id} accessibilityLabel={t.name} style={[styles.template, templateId === t.id && styles.selected]}>
          <AppText variant="body" style={styles.templateName}>{t.name}</AppText><Ionicons name={templateId === t.id ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={templateId === t.id ? colors.sageInk : colors.textMuted} />
        </Pressable>)}
      </View> : null}
      <Field label="Название" value={title} onChangeText={setTitle} maxLength={120} />
      <View style={styles.fields}><View style={styles.field}><Field label="Начало (необязательно)" value={time} onChangeText={setTime} placeholder="19:30" keyboardType="numbers-and-punctuation" maxLength={5} /></View>{kind === 'cardio' ? <View style={styles.field}><Field label="Длительность, мин" value={minutes} onChangeText={setMinutes} placeholder="Без длительности" keyboardType="number-pad" /></View> : null}</View>
      <Field label="Заметка" value={note} onChangeText={setNote} placeholder={kind === 'cardio' ? 'Например, лёгкая поездка или интервалы' : 'По желанию'} multiline maxLength={1000} />
      {error ? <AppText variant="caption" tone="danger" accessibilityRole="alert">{error}</AppText> : null}
      <AppButton label={activity ? 'Сохранить изменения' : 'Добавить в план'} onPress={save} testID="training-editor-save" />
      <AppText variant="caption" tone="muted">Выполненные велотренировки появятся после синхронизации Garmin.</AppText>
    </ScrollView>
  </SwipeToDismissSheet>;
}
const styles = StyleSheet.create({
  content: { padding: space.screen, gap: space.md }, head: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }, heading: { flex: 1, gap: space.xs }, close: { minHeight: touchMin, minWidth: touchMin, alignItems: 'center', justifyContent: 'center' },
  templates: { gap: space.xs }, template: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: touchMin, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.surface }, templateName: { flex: 1 }, selected: { backgroundColor: colors.trainingStrength },
  fields: { flexDirection: 'row', gap: space.md }, field: { flex: 1, minWidth: 0 },
});
