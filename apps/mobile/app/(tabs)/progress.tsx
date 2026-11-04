import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { bmiBand, computeBmi, formatBmi } from '../../../../src/domain/bmi';
import { datesInWeekFromStart, weekStartMonday } from '../../../../src/domain/habitWeek';
import {
  buildMonthOverview,
  datesEndingOn,
} from '../../../../src/domain/monthOverview';
import { buildWeekNutrition } from '../../../../src/domain/weekNutrition';
import { collectWeeklyInsightStats } from '../../../../src/domain/weeklyInsight';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { WeekBarChart } from '@/src/components/WeekBarChart';
import { WeekNutritionStrip } from '@/src/components/WeekNutritionStrip';
import { WeightSparkline } from '@/src/components/WeightSparkline';
import { formatWeekRangeRu } from '@/src/components/weekFormat';
import { localDateKey } from '../../../../src/storage/validation';
import { ChallengesPanel } from '@/src/features/challenges/ChallengesPanel';
import { FlexibleHabitsPanel } from '@/src/features/habits/FlexibleHabitsPanel';
import { collectDayReportText } from '@/src/features/progress/collectDayReport';
import { FlexibleReportPanel } from '@/src/features/progress/FlexibleReportPanel';
import { MonthOverviewCard } from '@/src/features/progress/MonthOverviewCard';
import { WeeklyInsightCard } from '@/src/features/progress/WeeklyInsightCard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  Field,
  MetricCard,
  SegmentedControl,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

/** Stage 4.4: ≤4 top segments. */
type ProgressTab = 'overview' | 'body' | 'habits' | 'reports';

const TABS: { id: ProgressTab; label: string }[] = [
  { id: 'overview', label: 'Неделя' },
  { id: 'body', label: 'Тело' },
  { id: 'habits', label: 'Привычки' },
  { id: 'reports', label: 'Отчёты' },
];

function fmtSleepHours(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default function ProgressScreen() {
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [tab, setTab] = useState<ProgressTab>('overview');
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [kgRaw, setKgRaw] = useState('');
  const [weekExtraOpen, setWeekExtraOpen] = useState(false);
  const [bmiNoteOpen, setBmiNoteOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const sleepWeek = useMemo(() => {
    const start = weekStartMonday(dateLocal);
    const days = datesInWeekFromStart(start).map((d, weekdayIndex) => {
      const n = repo.getSleepForDate(d);
      const hours = n?.sleepSec != null ? n.sleepSec / 3600 : 0;
      return {
        date: d,
        weekdayIndex,
        hours,
        value: hours,
        valueLabel: n?.sleepSec == null ? '—' : fmtSleepHours(n.sleepSec),
        hasData: n?.sleepSec != null,
        score: n?.sleepScore ?? null,
      };
    });
    const known = days.filter((d) => d.hasData);
    const sumSec = known.reduce((s, d) => s + d.hours * 3600, 0);
    const scored = known.filter((d) => d.score != null);
    const avgScore =
      scored.length === 0
        ? null
        : scored.reduce((s, d) => s + (d.score as number), 0) / scored.length;
    return {
      start,
      end: days[6]?.date ?? start,
      days,
      known: known.length,
      avgHours: known.length === 0 ? null : sumSec / known.length / 3600,
      avgScore,
    };
  }, [repo, dateLocal, revision]);

  const foodDaysLogged = useMemo(
    () => weekDays.filter((d) => d.entryCount > 0).length,
    [weekDays],
  );

  const monthOverview = useMemo(() => {
    const dates = datesEndingOn(dateLocal, 30);
    const days = dates.map((d) => {
      const t = repo.dailyTotals(d);
      return {
        dateLocal: d,
        foodEntryCount: t.entryCount,
        energyKcal: t.energyKcal,
        activityMinutes: repo.activityMinutesForDate(d),
        sleepSec: repo.getSleepForDate(d)?.sleepSec ?? null,
      };
    });
    const monthWeights = repo.listWeights(90);
    const inWindow = monthWeights.filter((w) => {
      const key = localDateKey(new Date(w.weighedAt), profile.timezone);
      return key >= dates[0]! && key <= dates[dates.length - 1]!;
    });
    const oldest = inWindow.length ? inWindow[inWindow.length - 1]!.kg : null;
    const newest = inWindow.length ? inWindow[0]!.kg : null;
    return buildMonthOverview({
      days,
      weightOldestKg: oldest,
      weightNewestKg: newest,
    });
  }, [repo, dateLocal, profile.timezone, revision]);

  const onExport = async () => {
    const json = repo.exportAll();
    setLastExport(json);
    try {
      await Clipboard.setStringAsync(json);
      showFlash('Экспорт скопирован в буфер');
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
            <AppCard style={styles.weekHero} testID="progress-week-hero">
              <View style={styles.glanceRow} accessibilityLabel="Сводка недели">
                <GlanceCell label="еда" value={`${foodDaysLogged}/7`} />
                <View style={styles.glanceRule} />
                <GlanceCell
                  label="спорт"
                  value={sportWeekMinutes.mins > 0 ? String(sportWeekMinutes.mins) : '—'}
                  unit={sportWeekMinutes.mins > 0 ? 'мин' : undefined}
                />
                <View style={styles.glanceRule} />
                <GlanceCell
                  label="сон"
                  value={sleepWeek.avgHours == null ? '—' : sleepWeek.avgHours.toFixed(1)}
                  unit={sleepWeek.avgHours == null ? undefined : 'ч'}
                />
                <View style={styles.glanceRule} />
                <GlanceCell
                  label="вес"
                  value={latest ? String(latest.kg) : '—'}
                  unit={latest ? 'кг' : undefined}
                />
              </View>
              <AppText variant="caption" tone="muted" style={styles.weekHint}>
                С понедельника · неизвестные значения — «—», не считаем нулём
              </AppText>
            </AppCard>

            <GroupLabel>Питание</GroupLabel>
            <WeekNutritionStrip
              days={weekDays}
              selectedDate={dateLocal}
              targetKcal={profile.dailyEnergyKcal}
              onSelectDate={setDateLocal}
              timeZone={profile.timezone}
            />

            <GroupLabel>Движение и сон</GroupLabel>
            <WeekBarChart
              title="Шаги"
              subtitle={`${formatWeekRangeRu(stepsWeek.start, stepsWeek.end)} · ${stepsWeek.knownDays} дн.`}
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

            <WeekBarChart
              title="Сон"
              subtitle={`${formatWeekRangeRu(sleepWeek.start, sleepWeek.end)} · ${sleepWeek.known} ноч. · ср. ${
                sleepWeek.avgHours == null ? '—' : `${sleepWeek.avgHours.toFixed(1)} ч`
              }`}
              selectedDate={dateLocal}
              todayDate={todayKey}
              onSelectDate={setDateLocal}
              footnote="Пустой столбик — нет импорта Garmin, не «ноль часов»."
              days={sleepWeek.days.map((d) => ({
                dateLocal: d.date,
                weekdayIndex: d.weekdayIndex,
                value: d.value,
                valueLabel: d.valueLabel,
              }))}
            />

            <AppCard style={styles.sportCard} testID="progress-sport-card">
              <MetricCard
                label="Тренировки"
                value={sportWeekMinutes.count}
                unit="шт"
                meta={`${sportWeekMinutes.mins} мин · MET не вычитается из еды`}
              />
            </AppCard>

            <Pressable
              onPress={() => setWeekExtraOpen((v) => !v)}
              style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: weekExtraOpen }}
              accessibilityLabel="Сводка и 30 дней"
            >
              <AppText variant="body" style={styles.moreTitle}>
                Сводка
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.moreMeta}>
                неделя · 30 дней
              </AppText>
              <Ionicons
                name={weekExtraOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
            {weekExtraOpen ? (
              <View style={styles.moreBody}>
                <WeeklyInsightCard insight={weekInsight} />
                <MonthOverviewCard overview={monthOverview} />
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'body' ? (
          <>
            <AppCard style={styles.bodyCard} testID="progress-weight-card">
              <View style={styles.bodyTop}>
                <View style={styles.bodyMetric}>
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
                </View>
                <View style={styles.bodyBmi}>
                  <AppText variant="label" tone="muted">
                    ИМТ
                  </AppText>
                  <AppText variant="metric" style={styles.bmiValue}>
                    {bmiInfo ? formatBmi(bmiInfo.value) : '—'}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {bmiInfo
                      ? bmiInfo.band.labelRu
                      : profile.heightCm == null
                        ? 'рост в Профиле'
                        : 'добавь вес'}
                  </AppText>
                </View>
              </View>

              <WeightSparkline weightsNewestFirst={weights.map((w) => w.kg)} />

              <View style={styles.weightForm}>
                <View style={styles.weightField}>
                  <Field
                    label="Новый замер, кг"
                    value={kgRaw}
                    onChangeText={setKgRaw}
                    keyboardType="decimal-pad"
                    placeholder="например 72.5"
                    returnKeyType="done"
                    blurOnSubmit
                    accessibilityLabel="Вес в килограммах"
                  />
                </View>
                <AppButton label="Сохранить" onPress={onSaveWeight} />
              </View>

              <Pressable
                onPress={() => setBmiNoteOpen((v) => !v)}
                style={({ pressed }) => [styles.noteToggle, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: bmiNoteOpen }}
              >
                <AppText variant="caption" tone="muted">
                  {bmiNoteOpen ? 'Скрыть справку ИМТ' : 'Что значит ИМТ'}
                </AppText>
                <Ionicons
                  name={bmiNoteOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
              {bmiNoteOpen ? (
                <AppText variant="caption" tone="secondary" style={styles.bmiNote}>
                  ИМТ = вес (кг) ÷ рост² (м). Ориентир ВОЗ для взрослых, не диагноз и не план
                  питания.
                  {profile.heightCm != null ? ` Рост в профиле: ${profile.heightCm} см.` : ''}
                  {bmiInfo ? ` ${bmiInfo.band.rangeRu}. ${bmiInfo.band.hintRu}` : ''}
                </AppText>
              ) : null}
            </AppCard>

            {weights.length > 0 ? (
              <>
                <Pressable
                  onPress={() => setHistoryOpen((v) => !v)}
                  style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: historyOpen }}
                >
                  <AppText variant="body" style={styles.moreTitle}>
                    История
                  </AppText>
                  <AppText variant="caption" tone="muted" style={styles.moreMeta}>
                    {weights.length} зам.
                  </AppText>
                  <Ionicons
                    name={historyOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
                {historyOpen ? (
                  <View style={styles.sheet}>
                    {weights.map((w, i) => (
                      <View
                        key={w.id}
                        style={[styles.weightRow, i < weights.length - 1 && styles.weightRowBorder]}
                      >
                        <AppText variant="body" style={styles.weightKg}>
                          {w.kg} кг{w.source === 'garmin' ? ' · Garmin' : ''}
                        </AppText>
                        <AppText variant="caption" tone="secondary">
                          {new Date(w.weighedAt).toLocaleDateString('ru-RU')}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {tab === 'habits' ? (
          <>
            <AppText variant="caption" tone="muted" style={styles.habitsLead}>
              Гибкие цели на неделю · без штрафов. Отметки дня — на «Сегодня».
            </AppText>
            <FlexibleHabitsPanel />
            <Pressable
              onPress={() => setChallengesOpen((v) => !v)}
              style={({ pressed }) => [styles.moreRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: challengesOpen }}
              accessibilityLabel="Челленджи"
            >
              <AppText variant="body" style={styles.moreTitle}>
                Челленджи
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.moreMeta}>
                по желанию
              </AppText>
              <Ionicons
                name={challengesOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
            {challengesOpen ? <ChallengesPanel /> : null}
          </>
        ) : null}

        {tab === 'reports' ? (
          <>
            <GroupLabel tight>День</GroupLabel>
            <AppCard style={styles.reportDayCard}>
              <AppText variant="caption" tone="muted" style={styles.reportDayHint}>
                Дата из общего календаря приложения
              </AppText>
              <AppButton
                label="Скопировать день для ChatGPT"
                onPress={() => void onCopyDayReport()}
                testID="progress-copy-day-chatgpt"
              />
              <AppText variant="caption" tone="muted">
                Только буфер · без облака
              </AppText>
            </AppCard>

            <GroupLabel>Период</GroupLabel>
            <FlexibleReportPanel />

            <GroupLabel>Бэкап</GroupLabel>
            <View style={styles.sheet}>
              <Pressable
                onPress={() => void onExport()}
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Экспорт JSON"
              >
                <View style={styles.linkIcon}>
                  <Ionicons name="share-outline" size={18} color={colors.ink} />
                </View>
                <View style={styles.linkText}>
                  <AppText variant="body" style={styles.linkTitle}>
                    Экспорт JSON
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Копия в буфер · удаление в Профиле
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

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

function GroupLabel({ children, tight }: { children: ReactNode; tight?: boolean }) {
  return (
    <AppText
      variant="label"
      tone="muted"
      style={[styles.groupLabel, tight && styles.groupLabelTight]}
    >
      {children}
    </AppText>
  );
}

function GlanceCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.glanceCell}>
      <AppText variant="label" tone="muted" style={styles.glanceLabel}>
        {label}
      </AppText>
      <AppText variant="subtitle" style={styles.glanceValue}>
        {value}
        {unit ? (
          <AppText variant="caption" tone="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  tabs: { marginBottom: space.sm },
  weekHero: {
    padding: space.md,
    gap: space.sm,
  },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  glanceCell: { flex: 1, alignItems: 'center', gap: 2 },
  glanceLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  glanceValue: { fontWeight: '800' },
  glanceRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  weekHint: { lineHeight: 17, paddingHorizontal: space.xs },
  groupLabel: {
    marginTop: space.md,
    marginBottom: space.xs,
    paddingHorizontal: space.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupLabelTight: { marginTop: space.xs },
  sportCard: { marginTop: space.xs },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginTop: space.sm,
  },
  moreTitle: { fontWeight: '700' },
  moreMeta: { flex: 1 },
  moreBody: { gap: space.sm, marginTop: space.xs },
  bodyCard: { gap: space.md, padding: space.lg },
  bodyTop: { flexDirection: 'row', gap: space.md },
  bodyMetric: { flex: 1.2 },
  bodyBmi: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    paddingLeft: space.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  bmiValue: { fontSize: 28 },
  weightForm: { gap: space.sm },
  weightField: {},
  noteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  bmiNote: { lineHeight: 18 },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: touchMin,
  },
  weightRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  weightKg: { fontWeight: '700' },
  habitsLead: { lineHeight: 18, marginBottom: space.xs },
  reportDayCard: { gap: space.sm, padding: space.lg },
  reportDayHint: { lineHeight: 17 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchMin + 4,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, gap: 2, minWidth: 0 },
  linkTitle: { fontWeight: '600' },
  preview: { marginTop: space.sm, gap: space.xs },
  previewBody: { fontSize: 12, color: colors.ink, fontFamily: 'monospace' },
  pressed: { opacity: 0.88 },
});
