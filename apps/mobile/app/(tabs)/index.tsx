import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { dayGreeting } from '../../../../src/domain/greeting';
import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { localDateKey } from '../../../../src/storage/validation';
import { shouldShowTargetsOnboarding } from '../../../../src/domain/targetsOnboarding';
import { DayStrip } from '@/src/components/DayStrip';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import { TargetsOnboardingSheet } from '@/src/features/diary/TargetsOnboardingSheet';
import { HomeActionCards } from '@/src/features/home/HomeActionCards';
import { HomeNutritionSplit } from '@/src/features/home/HomeNutritionSplit';
import { HomeWeightCard } from '@/src/features/home/HomeWeightCard';
import { useData } from '@/src/state/DataContext';
import { colors, space, touchMin, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';
import { BentoRow } from '@/src/ui/BentoRow';
import { CircleIconButton } from '@/src/ui/CircleIconButton';
import { InverseStrip } from '@/src/ui/InverseStrip';
import { ListRow } from '@/src/ui/ListRow';
import { SectionTitle } from '@/src/ui/SectionTitle';
import { SoftHeader } from '@/src/ui/SoftHeader';

/** Today = soft wellness home (ref 08) + jobs from ref 01. */
export default function TodayScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, refresh, revision, showFlash } = useData();
  void revision;
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const totals = repo.dailyTotals(dateLocal);
  const profile = repo.getProfile();
  const showTargetsOnboarding = shouldShowTargetsOnboarding(profile);
  const today = localDateKey(new Date(), profile.timezone);
  const waterMl = repo.waterMlForDate(dateLocal);
  const latest = repo.latestWeight();
  const weights = repo.listWeights(14);
  const activityMins = repo.activityMinutesForDate(dateLocal);
  const greeting = useMemo(() => dayGreeting(), [dateLocal]);

  const weekWeight = useMemo(() => {
    if (weights.length === 0) {
      return { kg: null as number | null, deltaLabel: null as string | null, deltaSigned: 0, bars: [] as number[] };
    }
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const newestAt = new Date(weights[0].weighedAt).getTime();
    const inWeek = weights.filter((w) => newestAt - new Date(w.weighedAt).getTime() <= weekMs);
    const series = [...inWeek].reverse();
    const kgs = series.map((w) => w.kg);
    const min = Math.min(...kgs);
    const max = Math.max(...kgs);
    const span = max - min;
    const bars = kgs.map((k) => (span <= 0 ? 0.55 : 0.2 + ((k - min) / span) * 0.8));
    let deltaLabel: string | null = null;
    let deltaSigned = 0;
    if (inWeek.length >= 2) {
      const oldest = inWeek[inWeek.length - 1];
      deltaSigned = Math.round((weights[0].kg - oldest.kg) * 10) / 10;
      if (deltaSigned === 0) deltaLabel = 'За неделю без изменений';
      else {
        const sign = deltaSigned > 0 ? '+' : '';
        deltaLabel = `За неделю ${sign}${deltaSigned} кг`;
      }
    }
    return {
      kg: latest?.kg ?? null,
      deltaLabel,
      deltaSigned,
      bars: bars.slice(-7),
    };
  }, [weights, latest]);

  const flexibleRows = useMemo(() => {
    return repo
      .listFlexibleHabits()
      .filter((h) => h.pausedAt == null)
      .slice(0, 3)
      .map((h) => {
        const stats = repo.flexibleHabitWeekStats(h.id, dateLocal);
        return {
          id: h.id,
          name: h.name,
          loggedToday: repo.isFlexibleHabitLogged(h.id, dateLocal),
          weekLabel: formatHabitWeekLabel(
            stats.completed,
            stats.target,
            h.kind === 'quantity' ? h.unit : null,
          ),
          marks: buildHabitWeekMarks({
            dateLocal,
            isLogged: (day) => repo.isFlexibleHabitLogged(h.id, day),
          }),
        };
      });
  }, [repo, dateLocal, revision]);

  const habitsDone = flexibleRows.filter((h) => h.loggedToday).length;
  const habitsTotal = flexibleRows.length;

  const waterLabel =
    profile.waterTargetMl && profile.waterTargetMl > 0
      ? `${(waterMl / 1000).toFixed(1)} / ${(profile.waterTargetMl / 1000).toFixed(1)} л`
      : waterMl > 0
        ? `${(waterMl / 1000).toFixed(1)} л`
        : '0 л';

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <SoftHeader
          eyebrow={greeting}
          title="Сегодня"
          action={
            <CircleIconButton
              icon="calendar-outline"
              onPress={() => setCalendarOpen(true)}
              accessibilityLabel="Открыть календарь"
            />
          }
        />

        <DayStrip
          selected={dateLocal}
          today={today}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

        <InverseStrip
          title="Записать еду"
          subtitle="Быстрый лог приёма"
          onPress={() => setOpen(true)}
          accessibilityLabel="Записать еду"
        />

        <SectionTitle title="Самочувствие" />
        <BentoRow>
          <View style={styles.bentoFlex}>
            <HomeWeightCard
              kg={weekWeight.kg}
              deltaLabel={weekWeight.deltaLabel}
              deltaSigned={weekWeight.deltaSigned}
              weekBars={weekWeight.bars}
              onPress={() => router.push('/progress')}
            />
          </View>
          <AppCard
            onPress={() => router.push('/(tabs)/activity')}
            style={styles.activityCard}
            accessibilityLabel={`Активность ${activityMins} минут`}
          >
            <Text style={styles.activityLabel}>Активность</Text>
            <Text style={styles.activityValue}>{activityMins}</Text>
            <Text style={styles.activityUnit}>мин сегодня</Text>
            <View style={styles.activityHint}>
              <Ionicons name="fitness-outline" size={18} color={colors.textMuted} />
              <Text style={styles.activityMeta}>Открыть</Text>
            </View>
          </AppCard>
        </BentoRow>

        <HomeNutritionSplit
          totals={totals}
          targets={{
            energyKcal: profile.dailyEnergyKcal,
            proteinG: profile.dailyProteinG,
            fatG: profile.dailyFatG,
            carbG: profile.dailyCarbG,
          }}
          onPress={() => router.push('/(tabs)/food')}
        />

        <HomeActionCards
          onStartWorkout={() => router.push('/(tabs)/activity')}
          onLogMeal={() => setOpen(true)}
        />

        <SectionTitle title="Прогресс дня" />
        <AppCard padding="none" style={styles.progressCard}>
          <ListRow
            title={`Вода ${waterLabel}`}
            trailing="+250 мл"
            iconName="water-outline"
            onPress={() => {
              repo.addWater(dateLocal, 250);
              refresh();
              showFlash('+250 мл воды');
            }}
            accessibilityLabel={`Вода ${waterLabel}. Добавить 250 миллилитров`}
          />
          <ListRow
            title={habitsTotal === 0 ? 'Привычки' : `Привычки ${habitsDone}/${habitsTotal}`}
            trailing="→"
            iconName="checkbox-outline"
            onPress={() => router.push('/progress')}
            accessibilityLabel="Привычки"
          />
          {flexibleRows.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => {
                if (repo.isFlexibleHabitLogged(h.id, dateLocal)) {
                  repo.unlogFlexibleHabit(h.id, dateLocal);
                  refresh();
                  showFlash(`Снято: ${h.name}`);
                } else {
                  repo.logFlexibleHabit(h.id, dateLocal);
                  refresh();
                  showFlash(`Отмечено: ${h.name}`);
                }
              }}
              style={({ pressed }) => [styles.habitRow, pressed && styles.pressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: h.loggedToday }}
              accessibilityLabel={`${h.name}, ${h.weekLabel}`}
            >
              <View style={[styles.check, h.loggedToday && styles.checkOn]}>
                {h.loggedToday ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryButtonText} />
                ) : null}
              </View>
              <Text style={[styles.habitName, h.loggedToday && styles.habitDone]} numberOfLines={1}>
                {h.name}
              </Text>
              <Text style={styles.habitMeta}>{h.weekLabel}</Text>
            </Pressable>
          ))}
        </AppCard>

        <Pressable
          onPress={() => setBarcodeOpen(true)}
          style={styles.secondaryLink}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Text style={styles.secondaryLinkText}>Штрихкод →</Text>
        </Pressable>
      </FormScrollView>

      <TargetsOnboardingSheet
        visible={showTargetsOnboarding}
        onSkip={() => {
          repo.dismissTargetsOnboardingPrompt();
          refresh();
          showFlash('Цели можно задать в Профиле');
        }}
        onSave={(values) => {
          repo.setDailyNutritionTargets(values);
          refresh();
          showFlash('Цели сохранены');
        }}
      />
      <AddFoodSheet visible={open} onClose={() => setOpen(false)} />
      <BarcodeLookupSheet visible={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <FlashBar />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: 120 },
  bentoFlex: { flex: 1 },
  activityCard: {
    flex: 1,
    minHeight: 168,
    gap: 2,
  },
  activityLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: type.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
  },
  activityUnit: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  activityHint: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  activityMeta: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
  },
  progressCard: {
    marginBottom: space.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  habitName: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  habitDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  habitMeta: { fontSize: type.micro, color: colors.textMuted },
  secondaryLink: {
    paddingVertical: space.sm,
    minHeight: touchMin,
    justifyContent: 'center',
  },
  secondaryLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.88 },
});
