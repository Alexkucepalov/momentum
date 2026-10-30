import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { bmiBand, computeBmi, formatBmi } from '../../../../src/domain/bmi';
import { buildWeekNutrition } from '../../../../src/domain/weekNutrition';
import { collectWeeklyInsightStats } from '../../../../src/domain/weeklyInsight';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { SectionHeader } from '@/src/components/SectionHeader';
import { WeekNutritionStrip } from '@/src/components/WeekNutritionStrip';
import { WeightSparkline } from '@/src/components/WeightSparkline';
import { ChallengesPanel } from '@/src/features/challenges/ChallengesPanel';
import { FlexibleHabitsPanel } from '@/src/features/habits/FlexibleHabitsPanel';
import { FlexibleReportPanel } from '@/src/features/progress/FlexibleReportPanel';
import { WeeklyInsightCard } from '@/src/features/progress/WeeklyInsightCard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  MetricCard,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';

type ProgressTab = 'body' | 'food' | 'sport' | 'habits' | 'summary';

const TABS: { id: ProgressTab; label: string }[] = [
  { id: 'body', label: 'Тело' },
  { id: 'food', label: 'Питание' },
  { id: 'sport', label: 'Спорт' },
  { id: 'habits', label: 'Привычки' },
  { id: 'summary', label: 'Итоги' },
];

export default function ProgressScreen() {
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [tab, setTab] = useState<ProgressTab>('summary');
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
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}
                onPress={() => setTab(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
              >
                <AppText
                  variant="label"
                  tone={on ? 'inverse' : 'secondary'}
                  style={[styles.tabText, on && styles.tabTextOn]}
                  numberOfLines={1}
                >
                  {t.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {tab === 'summary' ? <WeeklyInsightCard insight={weekInsight} /> : null}

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
                    <Text style={styles.weightKg}>{w.kg} кг</Text>
                    <Text style={styles.weightDate}>
                      {new Date(w.weighedAt).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {tab === 'food' ? (
          <>
            <WeekNutritionStrip
              days={weekDays}
              selectedDate={dateLocal}
              targetKcal={profile.dailyEnergyKcal}
              onSelectDate={setDateLocal}
              timeZone={profile.timezone}
            />
            <AppCard style={styles.card}>
              <AppText variant="label" tone="muted">
                Питание за неделю
              </AppText>
              <AppText variant="metric">
                {weekDays.filter((d) => d.entryCount > 0).length} / 7
              </AppText>
              <AppText variant="caption" tone="secondary">
                График — только здесь. Неизвестные ккал не считаем нулём.
              </AppText>
              {weekDays.map((d) => (
                <View key={d.dateLocal} style={styles.foodRow}>
                  <AppText variant="body" style={styles.foodDay}>
                    {d.dateLocal.slice(5)}
                  </AppText>
                  <AppText variant="caption" tone="secondary">
                    {d.entryCount > 0
                      ? d.energyKcal != null
                        ? `${Math.round(d.energyKcal)} ккал · ${d.entryCount}`
                        : `ккал неизв. · ${d.entryCount}`
                      : '—'}
                  </AppText>
                </View>
              ))}
            </AppCard>
          </>
        ) : null}

        {tab === 'sport' ? (
          <AppCard style={styles.card} testID="progress-sport-card">
            <MetricCard
              label="Тренировки"
              value={sportWeekMinutes.count}
              unit="шт"
              meta={`${sportWeekMinutes.mins} мин · MET не вычитается из еды`}
            />
            <AppText variant="caption" tone="secondary">
              Оценка энергии — ориентир по MET, не вычитается из дневника еды. Детали — во вкладке
              Активность.
            </AppText>
          </AppCard>
        ) : null}

        {tab === 'summary' ? (
          <>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.lg,
  },
  tab: {
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  tabText: { fontWeight: '700' },
  tabTextOn: { color: colors.primaryButtonText },
  habitsLead: {
    lineHeight: 18,
    marginBottom: space.md,
  },
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
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  foodDay: { fontWeight: '700' },
  preview: {
    marginTop: space.lg,
  },
  previewBody: { fontSize: 12, color: colors.ink, fontFamily: 'monospace' },
  pressed: { opacity: 0.88 },
});
