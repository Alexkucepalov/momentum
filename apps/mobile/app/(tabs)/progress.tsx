import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { bmiBand, computeBmi, formatBmi } from '../../../../src/domain/bmi';
import { buildWeekNutrition } from '../../../../src/domain/weekNutrition';
import { collectWeeklyInsightStats } from '../../../../src/domain/weeklyInsight';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { WeekNutritionStrip } from '@/src/components/WeekNutritionStrip';
import { WEEKDAY_SHORT_RU_CAP } from '@/src/components/weekFormat';
import { ChallengesPanel } from '@/src/features/challenges/ChallengesPanel';
import { FlexibleHabitsPanel } from '@/src/features/habits/FlexibleHabitsPanel';
import { FlexibleReportPanel } from '@/src/features/progress/FlexibleReportPanel';
import { ProgressWeightHero } from '@/src/features/progress/ProgressWeightHero';
import { WeeklyInsightCard } from '@/src/features/progress/WeeklyInsightCard';
import { WeightLogSheet } from '@/src/features/progress/WeightLogSheet';
import { useData } from '@/src/state/DataContext';
import { shell } from '@/src/theme/shell';
import { colors, radius, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { BentoRow } from '@/src/ui/BentoRow';
import { BentoStat } from '@/src/ui/BentoStat';
import { ListRow } from '@/src/ui/ListRow';
import { SectionTitle } from '@/src/ui/SectionTitle';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { SoftHeader } from '@/src/ui/SoftHeader';

type ProgressTab = 'overview' | 'body' | 'food' | 'habits';

const TABS: { id: ProgressTab; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'body', label: 'Тело' },
  { id: 'food', label: 'Еда' },
  { id: 'habits', label: 'Привычки' },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [tab, setTab] = useState<ProgressTab>('overview');
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
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

  /** Newest vs oldest weigh-in in the last 7 days — observation only, not a goal. */
  const weekWeightDelta = useMemo(() => {
    if (weights.length < 2) return null;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const newestAt = new Date(weights[0].weighedAt).getTime();
    const inWeek = weights.filter((w) => newestAt - new Date(w.weighedAt).getTime() <= weekMs);
    if (inWeek.length < 2) return null;
    const oldest = inWeek[inWeek.length - 1];
    const delta = Math.round((weights[0].kg - oldest.kg) * 10) / 10;
    if (delta === 0) return { text: 'За неделю без изменений', signed: 0 };
    const sign = delta > 0 ? '+' : '';
    return { text: `За неделю ${sign}${delta} кг`, signed: delta };
  }, [weights]);

  const weightBars = useMemo(() => {
    const chrono = [...weights].reverse().slice(-7).map((w) => w.kg);
    if (chrono.length === 0) return [];
    const min = Math.min(...chrono);
    const max = Math.max(...chrono);
    const span = max - min;
    return chrono.map((k) => (span <= 0 ? 0.55 : 0.2 + ((k - min) / span) * 0.8));
  }, [weights]);

  const loggedFoodDays = weekDays.filter((d) => d.entryCount > 0).length;
  const weightHint = latest
    ? new Date(latest.weighedAt).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'наблюдение, не цель';

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

  const onSaveWeight = (kg: number) => {
    try {
      repo.addWeight(kg);
      refresh();
      showFlash(`Вес сохранён: ${kg} кг`);
      setWeightOpen(false);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  const onDeleteWeight = (id: string, kg: number) => {
    Alert.alert('Удалить запись?', `${kg} кг исчезнет из истории и графика.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          try {
            repo.softDeleteWeight(id);
            refresh();
            showFlash('Запись веса удалена');
          } catch (e) {
            Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалено');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <FormScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <SoftHeader eyebrow="Наблюдения" title="Прогресс" />
        <ProgressWeightHero
          kg={latest?.kg ?? null}
          deltaLabel={weekWeightDelta?.text ?? null}
          deltaSigned={weekWeightDelta?.signed ?? 0}
          hint={weightHint}
          bars={weightBars}
          onLog={() => setWeightOpen(true)}
        />
        <BentoRow>
          <BentoStat
            label="ЕДА"
            value={`${loggedFoodDays}/7`}
            meta="дней с записями"
            onPress={() => setTab('food')}
          />
          <BentoStat
            label="ДВИЖЕНИЕ"
            value={String(sportWeekMinutes.mins)}
            meta={`${sportWeekMinutes.count} тренировок`}
            onPress={() => router.push('/(tabs)/activity')}
          />
        </BentoRow>
        <Text style={styles.note}>
          Минуты — факт. Оценка ккал тренировки не вычитается из еды.
        </Text>
        <SegmentedControl dense value={tab} options={TABS} onChange={setTab} />

        {tab === 'habits' ? (
          <>
            <SectionTitle title="Привычки" />
            <Text style={styles.habitsLead}>Настройка целей · отметки на «Сегодня»</Text>
            <FlexibleHabitsPanel />
            <ChallengesPanel />
          </>
        ) : null}

        {tab === 'body' ? (
          <>
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>ИМТ и здоровье</Text>
              {bmiInfo ? (
                <>
                  <Text style={styles.bmiValue}>{formatBmi(bmiInfo.value)}</Text>
                  <Text style={styles.bmiLabel}>{bmiInfo.band.labelRu}</Text>
                  <Text style={styles.cardHint}>{bmiInfo.band.rangeRu}</Text>
                  <Text style={styles.healthBody}>{bmiInfo.band.hintRu}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bmiValue}>—</Text>
                  <Text style={styles.cardHint}>
                    {profile.heightCm == null
                      ? 'Укажи рост в Профиле и вес выше — появится ИМТ'
                      : 'Добавь вес — ИМТ посчитается автоматически'}
                  </Text>
                </>
              )}
              <View style={styles.healthBox}>
                <Text style={styles.healthTitle}>Кратко</Text>
                <Text style={styles.healthBody}>
                  ИМТ = вес (кг) ÷ рост² (м). Это справочный ориентир ВОЗ для взрослых, не диагноз и
                  не план питания. При вопросах о здоровье — к врачу.
                </Text>
                {profile.heightCm != null ? (
                  <Text style={styles.healthMeta}>Рост в профиле: {profile.heightCm} см</Text>
                ) : null}
              </View>
            </AppCard>

            {weights.length > 0 ? (
              <>
                <SectionTitle title="История веса" />
                <AppCard padding="none" style={styles.listCard}>
                  {weights.map((w) => (
                    <ListRow
                      key={w.id}
                      divided={weights[0]?.id !== w.id}
                      title={`${w.kg} кг`}
                      meta={new Date(w.weighedAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      iconName="scale-outline"
                      onDelete={() => onDeleteWeight(w.id, w.kg)}
                      accessibilityLabel={`${w.kg} килограмм`}
                    />
                  ))}
                </AppCard>
              </>
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
            <SectionTitle title="По дням" />
            <AppCard padding="none" style={styles.listCard}>
              {weekDays.map((d, index) => {
                const trailing =
                  d.entryCount === 0
                    ? '—'
                    : d.energyKcal != null
                      ? String(Math.round(d.energyKcal))
                      : '—';
                const meta =
                  d.entryCount === 0
                    ? 'нет записей'
                    : d.energyKcal == null
                      ? `ккал неизвестны · ${d.entryCount}`
                      : `${d.entryCount} записей`;
                return (
                  <ListRow
                    key={d.dateLocal}
                    divided={index > 0}
                    title={`${WEEKDAY_SHORT_RU_CAP[d.weekdayIndex]} ${d.dateLocal.slice(8)}`}
                    meta={meta}
                    trailing={trailing}
                    iconName="restaurant-outline"
                    onPress={() => setDateLocal(d.dateLocal)}
                    accessibilityLabel={`${d.dateLocal}, ${meta}`}
                  />
                );
              })}
            </AppCard>
          </>
        ) : null}

        {tab === 'overview' ? (
          <>
            <SectionTitle title="Неделя" />
            <WeeklyInsightCard insight={weekInsight} />
            <FlexibleReportPanel />
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>Бэкап</Text>
              <Text style={styles.cardHint}>Экспорт JSON · полное удаление в Профиле</Text>
              <PrimaryButton
                variant="secondary"
                label="Экспорт JSON"
                onPress={() => void onExport()}
              />
              {lastExport ? (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Превью</Text>
                  <Text style={styles.previewBody} selectable>
                    {lastExport.slice(0, 400)}
                    {lastExport.length > 400 ? '…' : ''}
                  </Text>
                </View>
              ) : null}
            </AppCard>
          </>
        ) : null}
      </FormScrollView>
      <WeightLogSheet
        visible={weightOpen}
        onClose={() => setWeightOpen(false)}
        recent={weights}
        onLog={onSaveWeight}
      />
      <FlashBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: space.lg, paddingBottom: shell.screenBottom },
  habitsLead: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  note: {
    marginTop: -space.sm,
    marginBottom: space.md,
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bmiValue: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    marginTop: space.xs,
  },
  card: {
    marginBottom: space.md,
  },
  listCard: {
    marginBottom: space.md,
  },
  cardTitle: {
    fontSize: type.micro,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardValue: { fontSize: type.hero, fontWeight: '800', color: colors.text, marginTop: 4 },
  weightDelta: {
    marginTop: space.xs,
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  weightDeltaFocus: { color: colors.focus },
  cardHint: {
    fontSize: type.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: space.sm,
  },
  bmiLabel: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginTop: space.xs,
  },
  healthBox: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  healthTitle: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  healthBody: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  healthMeta: {
    marginTop: space.sm,
    fontSize: type.micro,
    color: colors.textMuted,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  foodDay: { fontWeight: '700', color: colors.text },
  foodMeta: { color: colors.textSecondary, fontSize: type.caption },
  preview: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previewLabel: { fontSize: type.caption, color: colors.textSecondary, marginBottom: space.sm },
  previewBody: { fontSize: 12, color: colors.text, fontFamily: 'monospace' },
});
