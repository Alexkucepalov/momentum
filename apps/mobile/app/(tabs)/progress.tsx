import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { bmiBand, computeBmi, formatBmi } from '../../../../src/domain/bmi';
import { buildWeekNutrition } from '../../../../src/domain/weekNutrition';
import { collectWeeklyInsightStats } from '../../../../src/domain/weeklyInsight';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SectionHeader } from '@/src/components/SectionHeader';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { WeekNutritionStrip } from '@/src/components/WeekNutritionStrip';
import { WeightSparkline } from '@/src/components/WeightSparkline';
import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { localDateKey } from '../../../../src/storage/validation';
import { ChallengesPanel } from '@/src/features/challenges/ChallengesPanel';
import { FlexibleHabitsPanel } from '@/src/features/habits/FlexibleHabitsPanel';
import { collectDayReportText } from '@/src/features/progress/collectDayReport';
import { FlexibleReportPanel } from '@/src/features/progress/FlexibleReportPanel';
import { WeeklyInsightCard } from '@/src/features/progress/WeeklyInsightCard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  MetricCard,
  SegmentedControl,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';

/** Stage 4.4: ≤4 top segments (food+sport folded into overview). */
type ProgressTab = 'overview' | 'body' | 'habits' | 'reports';

const TABS: { id: ProgressTab; label: string }[] = [
  { id: 'overview', label: 'Неделя' },
  { id: 'body', label: 'Тело' },
  { id: 'habits', label: 'Привычки' },
  { id: 'reports', label: 'Отчёты' },
];

export default function ProgressScreen() {
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [tab, setTab] = useState<ProgressTab>('overview');
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [kgRaw, setKgRaw] = useState('');
  const profile = repo.getProfile();
  const latest = repo.latestWeight();
  const weights = repo.listWeights(30);
  const weekDays = useMemo(
    () =>
      buildWeekNutrition({
        endDateLocal: dateLocal,
        targetKcal: profile.dailyEnergyKcal,
        totalsForDate: (d) => {
          const t = repo.dailyTotals(d);
          return { energyKcal: t.energyKcal, entryCount: t.entryCount };
        },
      }),
    [repo, dateLocal, profile.dailyEnergyKcal, revision],
  );

  const weekInsight = useMemo(
    () =>
      collectWeeklyInsightStats({
        endDateLocal: dateLocal,
        dailyTotals: (d) => repo.dailyTotals(d),
        activityMinutesForDate: (d) => repo.activityMinutesForDate(d),
        workoutsForDate: (d) => repo.listWorkoutsForDate(d).length,
        habitWeekStats: () =>
          repo.listFlexibleHabits().map((h) => {
            const s = repo.flexibleHabitWeekStats(h.id, dateLocal);
            return { completed: s.completed, target: s.target };
          }),
        challenges: () => repo.listChallenges().map((c) => ({ status: c.status })),
      }),
    [repo, dateLocal, revision],
  );

  const sportWeekMinutes = useMemo(() => {
    let mins = 0;
    let count = 0;
    for (const day of weekDays) {
      mins += repo.activityMinutesForDate(day.dateLocal);
      count += repo.listWorkoutsForDate(day.dateLocal).length;
    }
    return { mins, count };
  }, [repo, weekDays, revision]);

  const stepsWeek = useMemo(() => {
    const start = weekStartMonday(dateLocal);
    const days = datesInWeekFromStart(start).map((d, weekdayIndex) => {
      const steps = repo.getDailyActivityStats(d)?.steps ?? null;
      return {
        date: d,
        weekdayIndex,
        steps,
        value: steps ?? 0,
        valueLabel: steps == null ? '·' : steps >= 1000 ? `${Math.round(steps / 1000)}k` : String(steps),
      };
    });
    return {
      start,
      end: days[6]?.date ?? start,
      days,
      knownDays: days.filter((d) => d.steps != null).length,
    };
  }, [repo, dateLocal, revision]);

  const todayKey = localDateKey(new Date(), profile.timezone);

  const bmiInfo = useMemo(() => {
    if (!latest || profile.heightCm == null) return null;
    try {
      const value = computeBmi(latest.kg, profile.heightCm);
      return { value, band: bmiBand(value) };
    } catch {
      return null;
    }
  }, [latest, profile.heightCm]);

  const onExport = async () => {
    const json = repo.exportAll();
    setLastExport(json);
    try {
      await Clipboard.setStringAsync(json);
      Alert.alert('Экспорт', 'JSON скопирован в буфер. Сохрани его офлайн.');
    } catch {
      Alert.alert('Экспорт', 'JSON готов ниже. Скопируй вручную, если буфер недоступен.');
    }
  };

  const onCopyDayReport = async () => {
    try {
      const text = collectDayReportText(repo, dateLocal);
      await Clipboard.setStringAsync(text);
      showFlash('Отчёт за день скопирован — вставь в ChatGPT');
    } catch (e) {
      Alert.alert('Отчёт', e instanceof Error ? e.message : 'Не удалось скопировать');
    }
  };

  const sleepWeek = useMemo(() => {
    const start = weekStartMonday(dateLocal);
    const days = datesInWeekFromStart(start);
    let known = 0;
    let sumSec = 0;
    for (const d of days) {
      const n = repo.getSleepForDate(d);
      if (n?.sleepSec != null) {
        known += 1;
        sumSec += n.sleepSec;
      }
    }
    return {
      known,
      avgHours: known === 0 ? null : sumSec / known / 3600,
    };
  }, [repo, dateLocal, revision]);

  const onSaveWeight = () => {
    const kg = Number(kgRaw.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) {
      Alert.alert('Вес', 'Введи положительное число в кг');
      return;
    }
    try {
      repo.addWeight(kg);
      setKgRaw('');
      refresh();
      showFlash(`Вес сохранён: ${kg} кг`);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <View style={styles.root}>
      <FormScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.tabs}>
          <SegmentedControl<ProgressTab>
            accessibilityLabel="Раздел прогресса"
            value={tab}
            onChange={setTab}
            options={TABS.map((t) => ({ id: t.id, label: t.label }))}
          />
        </View>

        {tab === 'overview' ? (
          <>
            <WeeklyInsightCard insight={weekInsight} />
            <View style={styles.kpiGrid}>
              <AppCard style={styles.kpiCard}>
                <AppText variant="label" tone="muted">
                  Питание
                </AppText>
                <AppText variant="subtitle" style={styles.kpiValue}>
                  {weekDays.filter((d) => d.entryCount > 0).length}/7
                </AppText>
                <AppText variant="caption" tone="secondary">
                  дней с записями
                </AppText>
              </AppCard>
              <AppCard style={styles.kpiCard}>
                <AppText variant="label" tone="muted">
                  Спорт
                </AppText>
                <AppText variant="subtitle" style={styles.kpiValue}>
                  {sportWeekMinutes.mins > 0 ? sportWeekMinutes.mins : '—'}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  мин · {sportWeekMinutes.count} тр.
                </AppText>
              </AppCard>
              <AppCard style={styles.kpiCard}>
                <AppText variant="label" tone="muted">
                  Сон
                </AppText>
                <AppText variant="subtitle" style={styles.kpiValue}>
                  {sleepWeek.avgHours == null ? '—' : sleepWeek.avgHours.toFixed(1)}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  ср. ч · {sleepWeek.known} ноч.
                </AppText>
              </AppCard>
              <AppCard style={styles.kpiCard}>
                <AppText variant="label" tone="muted">
                  Вес
                </AppText>
                <AppText variant="subtitle" style={styles.kpiValue}>
                  {latest ? `${latest.kg}` : '—'}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  кг · последнее
                </AppText>
              </AppCard>
            </View>

            <AppText variant="caption" tone="muted" style={styles.backupHint}>
              Питание и шаги за неделю. Неизвестные ккал не считаем нулём.
            </AppText>
            <WeekNutritionStrip
              days={weekDays}
              selectedDate={dateLocal}
              targetKcal={profile.dailyEnergyKcal}
              onSelectDate={setDateLocal}
              timeZone={profile.timezone}
            />

            <WeekBarChart
              title="Шаги за неделю"
              subtitle={`${formatWeekRangeRu(stepsWeek.start, stepsWeek.end)} · ${stepsWeek.knownDays} дн. с данными`}
              selectedDate={dateLocal}
              todayDate={todayKey}
              onSelectDate={setDateLocal}
              footnote="Пустой день — нет импорта Garmin, не ноль шагов."
              days={stepsWeek.days.map((d) => ({
                dateLocal: d.date,
                weekdayIndex: d.weekdayIndex,
                value: d.value,
                valueLabel: d.valueLabel,
              }))}
            />

            <AppCard style={styles.card} testID="progress-sport-card">
              <MetricCard
                label="Тренировки"
                value={sportWeekMinutes.count}
                unit="шт"
                meta={`${sportWeekMinutes.mins} мин · MET не вычитается из еды`}
              />
            </AppCard>

            <AppButton
              label="Копировать отчёт за день → ChatGPT"
              onPress={() => void onCopyDayReport()}
            />
            <AppText variant="caption" tone="muted" style={styles.backupHint}>
              Прямого коннекта к ChatGPT нет. PDF и период — во вкладке «Отчёты».
            </AppText>
          </>
        ) : null}

        {tab === 'habits' ? (
          <>
            <AppText variant="caption" tone="secondary" style={styles.habitsLead}>
              Отметки за сегодня — на вкладке «Сегодня». Здесь настройка целей и челленджей.
            </AppText>
            <FlexibleHabitsPanel />
            <ChallengesPanel />
          </>
        ) : null}

        {tab === 'body' ? (
          <>
            <AppCard style={styles.card} testID="progress-weight-card">
              <MetricCard
                label="Вес"
                value={latest ? latest.kg : null}
                unit="кг"
                meta={
                  latest
                    ? new Date(latest.weighedAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'наблюдение, не цель'
                }
              />

              <WeightSparkline weightsNewestFirst={weights.map((w) => w.kg)} />

              <TextInput
                value={kgRaw}
                onChangeText={setKgRaw}
                keyboardType="decimal-pad"
                placeholder="кг"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Вес в килограммах"
              />
              <AppButton label="Сохранить вес" onPress={onSaveWeight} />
            </AppCard>

            <AppCard style={styles.card}>
              <AppText variant="label" tone="muted">
                ИМТ и здоровье
              </AppText>
              {bmiInfo ? (
                <>
                  <AppText variant="metric">{formatBmi(bmiInfo.value)}</AppText>
                  <AppText variant="subtitle">{bmiInfo.band.labelRu}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {bmiInfo.band.rangeRu}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {bmiInfo.band.hintRu}
                  </AppText>
                </>
              ) : (
                <>
                  <AppText variant="metric">—</AppText>
                  <AppText variant="caption" tone="secondary">
                    {profile.heightCm == null
                      ? 'Укажи рост в Профиле и вес выше — появится ИМТ'
                      : 'Добавь вес — ИМТ посчитается автоматически'}
                  </AppText>
                </>
              )}
              <View style={styles.healthBox}>
                <AppText variant="label" tone="muted">
                  Кратко
                </AppText>
                <AppText variant="caption" tone="secondary">
                  ИМТ = вес (кг) ÷ рост² (м). Это справочный ориентир ВОЗ для взрослых, не диагноз и
                  не план питания. При вопросах о здоровье — к врачу.
                </AppText>
                {profile.heightCm != null ? (
                  <AppText variant="label" tone="muted">
                    Рост в профиле: {profile.heightCm} см
                  </AppText>
                ) : null}
              </View>
            </AppCard>

            {weights.length > 0 ? (
              <View style={styles.list}>
                <SectionHeader title="История веса" />
                {weights.map((w) => (
                  <View key={w.id} style={styles.weightRow}>
                    <Text style={styles.weightKg}>
                      {w.kg} кг{w.source === 'garmin' ? ' · Garmin' : ''}
                    </Text>
                    <Text style={styles.weightDate}>
                      {new Date(w.weighedAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'reports' ? (
          <>
            <AppButton
              label="Копировать отчёт за выбранный день"
              variant="secondary"
              onPress={() => void onCopyDayReport()}
            />
            <AppText variant="caption" tone="muted" style={styles.backupHint}>
              День берётся из общего календаря приложения (Сегодня / свайп).
            </AppText>
            <FlexibleReportPanel />
            <SectionHeader title="Бэкап" />
            <AppText variant="caption" tone="muted" style={styles.backupHint}>
              Полное удаление и настройки приватности — также во вкладке Профиль.
            </AppText>
            <AppButton label="Экспорт JSON" onPress={() => void onExport()} />

            {lastExport ? (
              <AppCard style={styles.preview}>
                <AppText variant="caption" tone="secondary">
                  Превью экспорта
                </AppText>
                <Text style={styles.previewBody} selectable>
                  {lastExport.slice(0, 800)}
                  {lastExport.length > 800 ? '…' : ''}
                </Text>
              </AppCard>
            ) : null}
          </>
        ) : null}
      </FormScrollView>
      <FlashBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  content: { padding: space.lg },
  tabs: {
    marginBottom: space.lg,
  },
  habitsLead: {
    lineHeight: 18,
    marginBottom: space.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  kpiCard: {
    width: '47%',
    flexGrow: 1,
    gap: 4,
    minHeight: 96,
  },
  kpiValue: { fontWeight: '800' },
  card: {
    marginBottom: space.xl,
    gap: space.sm,
  },
  healthBox: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: space.xs,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontSize: type.body,
    color: colors.ink,
  },
  list: { marginBottom: space.xl },
  backupHint: {
    marginBottom: space.sm,
    lineHeight: 18,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
  },
  weightKg: { fontWeight: '700', color: colors.ink },
  weightDate: { color: colors.textSecondary },
  preview: {
    marginTop: space.lg,
  },
  previewBody: { fontSize: 12, color: colors.ink, fontFamily: 'monospace' },
});
