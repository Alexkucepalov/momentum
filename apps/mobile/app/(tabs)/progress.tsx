import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { bmiBand, computeBmi, formatBmi } from '../../../../src/domain/bmi';
import { buildWeekNutrition } from '../../../../src/domain/weekNutrition';
import { collectWeeklyInsightStats } from '../../../../src/domain/weeklyInsight';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SectionHeader } from '@/src/components/SectionHeader';
import { WeekNutritionStrip } from '@/src/components/WeekNutritionStrip';
import { WeightSparkline } from '@/src/components/WeightSparkline';
import { ChallengesPanel } from '@/src/features/challenges/ChallengesPanel';
import { FlexibleHabitsPanel } from '@/src/features/habits/FlexibleHabitsPanel';
import { FlexibleReportPanel } from '@/src/features/progress/FlexibleReportPanel';
import { WeeklyInsightCard } from '@/src/features/progress/WeeklyInsightCard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

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
                <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'summary' ? <WeeklyInsightCard insight={weekInsight} /> : null}

        {tab === 'habits' ? (
          <>
            <Text style={styles.habitsLead}>
              Отметки за сегодня — на вкладке «Сегодня». Здесь настройка целей и челленджей.
            </Text>
            <FlexibleHabitsPanel />
            <ChallengesPanel />
          </>
        ) : null}

        {tab === 'body' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Вес</Text>
              <Text style={styles.cardValue}>{latest ? `${latest.kg} кг` : '—'}</Text>
              <Text style={styles.cardHint}>
                {latest
                  ? new Date(latest.weighedAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'добавь первое значение — это наблюдение, не цель'}
              </Text>

              <WeightSparkline
                weightsNewestFirst={weights.map((w) => w.kg)}
                entriesNewestFirst={weights.map((w) => ({ kg: w.kg, weighedAt: w.weighedAt }))}
              />

              <TextInput
                value={kgRaw}
                onChangeText={setKgRaw}
                keyboardType="decimal-pad"
                placeholder="кг"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Вес в килограммах"
              />
              <PrimaryButton label="Сохранить вес" onPress={onSaveWeight} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>ИМТ и здоровье</Text>
              {bmiInfo ? (
                <>
                  <Text style={styles.cardValue}>{formatBmi(bmiInfo.value)}</Text>
                  <Text style={styles.bmiLabel}>{bmiInfo.band.labelRu}</Text>
                  <Text style={styles.cardHint}>{bmiInfo.band.rangeRu}</Text>
                  <Text style={styles.healthBody}>{bmiInfo.band.hintRu}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.cardValue}>—</Text>
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
            </View>

            {weights.length > 0 ? (
              <View style={styles.list}>
                <SectionHeader title="История веса" />
                {weights.map((w) => (
                  <View key={w.id} style={styles.weightRow}>
                    <View style={styles.weightMeta}>
                      <Text style={styles.weightKg}>{w.kg} кг</Text>
                      <Text style={styles.weightDate}>
                        {new Date(w.weighedAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onDeleteWeight(w.id, w.kg)}
                      style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Удалить запись ${w.kg} килограмм`}
                    >
                      <Text style={styles.deleteText}>Удалить</Text>
                    </Pressable>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Питание за неделю</Text>
              <Text style={styles.cardValue}>
                {weekDays.filter((d) => d.entryCount > 0).length} / 7 дней
              </Text>
              <Text style={styles.cardHint}>
                График — только здесь. Неизвестные ккал не считаем нулём.
              </Text>
              {weekDays.map((d) => (
                <View key={d.dateLocal} style={styles.foodRow}>
                  <Text style={styles.foodDay}>{d.dateLocal.slice(5)}</Text>
                  <Text style={styles.foodMeta}>
                    {d.entryCount > 0
                      ? d.energyKcal != null
                        ? `${Math.round(d.energyKcal)} ккал · ${d.entryCount}`
                        : `ккал неизв. · ${d.entryCount}`
                      : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'sport' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Спорт за неделю</Text>
            <Text style={styles.cardValue}>{sportWeekMinutes.count} тренировок</Text>
            <Text style={styles.cardHint}>{sportWeekMinutes.mins} мин суммарно</Text>
            <Text style={styles.healthBody}>
              Оценка энергии — ориентир по MET, не вычитается из дневника еды. Детали — во вкладке
              Активность.
            </Text>
          </View>
        ) : null}

        {tab === 'summary' ? (
          <>
            <FlexibleReportPanel />
            <SectionHeader title="Бэкап" />
            <Text style={styles.backupHint}>
              Полное удаление и настройки приватности — также во вкладке Профиль.
            </Text>
            <PrimaryButton label="Экспорт JSON" onPress={() => void onExport()} />

            {lastExport ? (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Превью экспорта</Text>
                <Text style={styles.previewBody} selectable>
                  {lastExport.slice(0, 800)}
                  {lastExport.length > 800 ? '…' : ''}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </FormScrollView>
      <FlashBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  tabOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  tabText: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  tabTextOn: { color: colors.primaryButtonText },
  habitsLead: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginBottom: space.xl,
  },
  cardTitle: { fontSize: type.caption, color: colors.textMuted },
  cardValue: { fontSize: type.hero, fontWeight: '800', color: colors.text, marginTop: 4 },
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  list: { marginBottom: space.xl },
  backupHint: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.sm,
    lineHeight: 18,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
  },
  weightMeta: { flex: 1, minWidth: 0, gap: 2 },
  weightKg: { fontWeight: '700', color: colors.text },
  weightDate: { color: colors.textSecondary, fontSize: type.caption },
  deleteBtn: {
    minHeight: touchMin,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  deleteText: { fontWeight: '700', color: colors.danger, fontSize: type.caption },
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginTop: space.lg,
  },
  previewLabel: { fontSize: type.caption, color: colors.textSecondary, marginBottom: space.sm },
  previewBody: { fontSize: 12, color: colors.text, fontFamily: 'monospace' },
  pressed: { opacity: 0.88 },
});
