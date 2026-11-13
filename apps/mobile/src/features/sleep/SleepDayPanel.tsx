import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { datesInWeekFromStart, weekStartMonday } from '../../../../../src/domain/habitWeek';
import { buildSleepStageRows, formatSleepClock, formatSleepDuration, sleepEfficiencyPercent, sleepWeekSummary, type SleepStageKey } from '../../../../../src/domain/sleepStats';
import { DayStrip } from '@/src/components/DayStrip';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { AppButton, AppCard, AppText, colors, radius, space, touchMin } from '@/src/design-system';
import { SleepEntrySheet } from './SleepEntrySheet';

const STAGE_COLOR: Record<SleepStageKey, string> = { deep: colors.ink, light: colors.textSecondary, rem: colors.textMuted, awake: colors.borderStrong };
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
export function SleepDayPanel({ todayKey, onUndo }: { todayKey: string; onUndo?: (message: string, undo: () => void) => void }) {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh } = useData();
  const revision = useAnyRevision();
  const [entryOpen, setEntryOpen] = useState(false);
  const night = repo.getSleepForDate(dateLocal);
  const profile = repo.getProfile();
  const sync = repo.getGarminSyncState();
  const week = useMemo(() => {
    const start = weekStartMonday(dateLocal), dates = datesInWeekFromStart(start);
    const nights = dates.map(date => repo.getSleepForDate(date));
    return { start, end: dates[6]!, nights, summary: sleepWeekSummary(nights), days: dates.map((dateLocal, weekdayIndex) => ({ dateLocal, weekdayIndex, value: (nights[weekdayIndex]?.sleepSec ?? 0) / 3600, valueLabel: formatSleepDuration(nights[weekdayIndex]?.sleepSec ?? null) ?? '—' })) };
  }, [repo, dateLocal, revision]);
  const stages = night ? buildSleepStageRows(night) : [];
  const hasStage = stages.some(s => s.sec != null);
  const partial = stages.slice(0, 3).some(s => s.sec == null);
  const efficiency = night ? sleepEfficiencyPercent(night.sleepSec, night.awakeSec) : null;
  const startClock = formatSleepClock(night?.startAt ?? null, profile.timezone);
  const endClock = formatSleepClock(night?.endAt ?? null, profile.timezone);
  const duration = formatSleepDuration(night?.sleepSec ?? null);
  const [hours, minutes] = duration?.split(':') ?? [];
  const latest = repo.listSleepNights(1)[0];
  const recordFeedback = (message: string, undo: () => void) => { refresh('activity'); onUndo?.(message, undo); };
  return <View style={styles.root} testID="sleep-day-panel">
    <DayStrip selected={dateLocal} today={todayKey} onSelect={setDateLocal} />
    <View style={styles.nightHead}><AppText variant="subtitle">Ночь на {dateLabel(dateLocal)}</AppText><Ionicons name="moon-outline" size={20} color={colors.textMuted} /></View>
    {!night ? <AppCard style={styles.empty}>
      <Ionicons name="moon-outline" size={32} color={colors.textMuted} />
      <AppText variant="subtitle">Пока без записи</AppText>
      <AppText variant="body" tone="secondary">Добавь длительность вручную или загрузи ночь из Garmin. Отсутствие записи не означает ноль часов.</AppText>
      {dateLocal <= todayKey ? <AppButton label="Записать сон" onPress={() => setEntryOpen(true)} testID="sleep-manual-add" /> : <AppText variant="caption" tone="muted">Эта ночь ещё впереди</AppText>}
      {latest && latest.dateLocal !== dateLocal ? <AppButton label={`Открыть ночь на ${dateLabel(latest.dateLocal)}`} variant="ghost" onPress={() => setDateLocal(latest.dateLocal)} /> : null}
    </AppCard> : <>
      <View style={styles.hero}>
        <View style={styles.duration}><AppText variant="label" tone="secondary">Длительность сна</AppText><AppText style={styles.durationValue}>{hours ?? '—'}{hours ? <AppText variant="body" tone="secondary"> ч </AppText> : null}{minutes ?? ''}{minutes ? <AppText variant="body" tone="secondary"> мин</AppText> : null}</AppText><AppText variant="caption" tone="secondary">{night.source === 'garmin' ? 'Garmin' : 'Ручная запись'}</AppText></View>
        {night.sleepScore != null ? <View style={styles.score}><AppText variant="label" tone="secondary">Оценка Garmin</AppText><AppText style={styles.scoreValue}>{Math.round(night.sleepScore)}<AppText variant="caption" tone="muted"> / 100</AppText></AppText></View> : null}
      </View>
      {startClock || endClock || efficiency != null ? <View style={styles.window}>
        <Vital label="Заснул" value={startClock ?? '—'} /><Vital label="Проснулся" value={endClock ?? '—'} /><Vital label="Доля сна" value={efficiency == null ? '—' : `${efficiency}%`} />
      </View> : null}
      {hasStage ? <AppCard style={styles.phases}>
        <AppText variant="subtitle">Состав ночи</AppText>
        <View style={styles.stageBar} accessibilityLabel="Суммарная длительность фаз, не хронология сна">{stages.map(s => s.barShare > 0 ? <View key={s.key} style={{ width: `${s.barShare * 100}%`, backgroundColor: STAGE_COLOR[s.key], height: '100%' }} /> : null)}</View>
        {stages.map(s => <View key={s.key} style={styles.stageRow}><View style={[styles.dot, { backgroundColor: STAGE_COLOR[s.key] }]} /><AppText variant="body" style={styles.stageName}>{s.labelRu}</AppText><AppText variant="body">{s.durationLabel ?? '—'}</AppText></View>)}
        {partial ? <AppText variant="caption" tone="muted">Часть фаз не пришла из Garmin. Неизвестные значения оставлены пустыми.</AppText> : null}
      </AppCard> : night.source === 'garmin' ? <AppText variant="caption" tone="muted">Данные о фазах за эту ночь пока не пришли.</AppText> : null}
      {night.avgSpo2 != null || night.avgRespiration != null ? <View style={styles.vitals}><Vital label="SpO₂, среднее" value={night.avgSpo2 == null ? '—' : `${night.avgSpo2.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`} /><Vital label="Дыхание, в минуту" value={night.avgRespiration == null ? '—' : night.avgRespiration.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} /></View> : null}
      {night.source === 'user' ? <AppButton label="Изменить запись сна" variant="secondary" onPress={() => setEntryOpen(true)} /> : null}
    </>}
    <WeekBarChart title="Сон за неделю" subtitle={`${formatWeekRangeRu(week.start, week.end)} · записано ночей: ${week.summary.knownCount}`} selectedDate={dateLocal} todayDate={todayKey} onSelectDate={setDateLocal} days={week.days} footnote="Считаем среднее только по записанным ночам. «—» — нет данных." />
    <View style={styles.averages}><Vital label="Средняя длительность" value={formatSleepDuration(week.summary.averageSec) ?? '—'} /><Vital label="Средняя оценка Garmin" value={week.summary.averageScore == null ? '—' : String(Math.round(week.summary.averageScore))} /></View>
    <Pressable onPress={() => router.push('/garmin' as Href)} style={styles.syncLink} accessibilityRole="button" accessibilityLabel="Открыть синхронизацию Garmin"><View style={styles.syncCopy}><AppText variant="body">Garmin</AppText><AppText variant="caption" tone="secondary">{sync.lastError ? 'Последняя синхронизация не завершилась' : sync.lastSuccessfulSyncAt ? `Обновлено ${new Date(sync.lastSuccessfulSyncAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: profile.timezone })}` : 'Подключение и синхронизация сна'}</AppText></View><Ionicons name="arrow-forward" size={18} color={colors.ink} /></Pressable>
    <SleepEntrySheet visible={entryOpen} dateLabel={dateLabel(dateLocal)} seconds={night?.source === 'user' ? night.sleepSec : null} onClose={() => setEntryOpen(false)} onSave={seconds => {
      const previous = night?.source === 'user' ? night : null;
      repo.upsertSleepNight({ dateLocal, source: 'user', sleepSec: seconds }); setEntryOpen(false);
      recordFeedback('Сон записан', () => { repo.removeManualSleepNight(dateLocal); if (previous) repo.restoreManualSleepNight(previous); });
    }} onDelete={night?.source === 'user' ? () => { const previous = repo.removeManualSleepNight(dateLocal); setEntryOpen(false); if (previous) recordFeedback('Ручная запись удалена', () => repo.restoreManualSleepNight(previous)); } : undefined} />
  </View>;
}
function Vital({ label, value }: { label: string; value: string }) { return <View style={styles.vital}><AppText variant="label" tone="secondary">{label}</AppText><AppText variant="subtitle">{value}</AppText></View>; }
const styles = StyleSheet.create({
  root: { gap: space.lg }, nightHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }, empty: { gap: space.md, padding: space.screen },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingVertical: space.sm, flexWrap: 'wrap' }, duration: { flexGrow: 1, gap: space.sm }, durationValue: { fontSize: 42, lineHeight: 56, fontWeight: '500', letterSpacing: -1.5 }, score: { gap: space.sm }, scoreValue: { fontSize: 28, lineHeight: 42, fontWeight: '500' },
  window: { flexDirection: 'row', gap: space.sm, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, vital: { flex: 1, minWidth: 0, gap: space.sm }, phases: { gap: space.md, padding: space.screen }, stageBar: { height: 14, backgroundColor: colors.surfaceMuted, flexDirection: 'row', borderRadius: radius.pill, overflow: 'hidden' },
  stageRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36, gap: space.sm }, stageName: { flex: 1 }, dot: { width: 8, height: 8, borderRadius: 3 }, vitals: { flexDirection: 'row', gap: space.md }, averages: { flexDirection: 'row', gap: space.md }, syncLink: { minHeight: touchMin, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, syncCopy: { flex: 1, gap: space.xs },
});
