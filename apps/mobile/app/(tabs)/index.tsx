import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { localDateKey } from '../../../../src/storage/validation';
import {
  repeatableDayFromEntries,
  shiftDateLocal,
} from '../../../../src/domain/repeatMeal';
import { shouldShowTargetsOnboarding } from '../../../../src/domain/targetsOnboarding';
import { AddFoodBlock } from '@/src/components/AddFoodBlock';
import { DayStrip } from '@/src/components/DayStrip';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { TodayPlanStrip } from '@/src/features/plan/TodayPlanStrip';
import { KcalRing } from '@/src/components/KcalRing';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import { TargetsOnboardingSheet } from '@/src/features/diary/TargetsOnboardingSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, surfaceCard, touchMin, type } from '@/src/theme/tokens';

function formatDateLine(iso: string, today: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = dt.toLocaleDateString('ru-RU', { weekday: 'long', timeZone: 'UTC' });
  const dayMonth = dt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  if (iso === today) return `${cap} · ${dayMonth}`;
  if (iso < today) return `${cap} · ${dayMonth} · прошлый день`;
  return `${cap} · ${dayMonth} · будущий день`;
}

/** Today = log food fast. Secondary (plan / water / habits) stays quiet below. */
export default function TodayScreen() {
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, setMeal, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const totals = repo.dailyTotals(dateLocal);
  const todayEntries = repo.listEntriesForDate(dateLocal);
  const recent = repo.listRecentEntries(6);
  const waterMl = repo.waterMlForDate(dateLocal);
  const profile = repo.getProfile();
  const showTargetsOnboarding = shouldShowTargetsOnboarding(profile);
  const today = localDateKey(new Date(), profile.timezone);
  const activityMinutes = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const dateLine = formatDateLine(dateLocal, today);
  const yesterdayCount = repo.listEntriesForDate(shiftDateLocal(dateLocal, -1)).length;

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
          completed: stats.completed,
          target: stats.target,
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

  const repeat = (e: (typeof recent)[number]) => {
    if (!allowAdd()) return;
    if (e.productId) {
      repo.addEntryFromProduct({
        productId: e.productId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    } else if (e.recipeId) {
      repo.addEntryFromRecipe({
        recipeId: e.recipeId,
        dateLocal,
        meal,
        grams: e.grams,
      });
    } else {
      return;
    }
    refresh();
    showFlash(`Добавлено: ${e.displayName}`);
  };

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.dateLine}>{dateLine}</Text>

        <DayStrip
          selected={dateLocal}
          today={today}
          onSelect={setDateLocal}
          onOpenCalendar={() => setCalendarOpen(true)}
        />

        <View style={styles.ringCard}>
          <KcalRing
            variant="compact"
            totals={totals}
            targets={{
              energyKcal: profile.dailyEnergyKcal,
              proteinG: profile.dailyProteinG,
              fatG: profile.dailyFatG,
              carbG: profile.dailyCarbG,
            }}
            activityKcal={activityKcal}
            activityMinutes={activityMinutes}
            onSetTarget={() => router.push('/profile')}
          />
        </View>

        <AddFoodBlock
          meal={meal}
          onChangeMeal={setMeal}
          showMealChips={false}
          todayEntries={todayEntries}
          quickRepeats={recent.map((e) => ({
            id: e.id,
            displayName: e.displayName,
            grams: e.grams,
          }))}
          onRepeat={(id) => {
            const e = recent.find((r) => r.id === id);
            if (e) repeat(e);
          }}
          onAddFood={() => setOpen(true)}
          onCopyYesterday={
            yesterdayCount > 0
              ? () => {
                  if (!allowAdd()) return;
                  const yesterday = shiftDateLocal(dateLocal, -1);
                  const items = repeatableDayFromEntries(repo.listEntriesForDate(yesterday));
                  if (items.length === 0) {
                    showFlash('Вчерашний рацион пуст или без продукта/рецепта');
                    return;
                  }
                  for (const item of items) {
                    if (item.kind === 'product') {
                      repo.addEntryFromProduct({
                        productId: item.productId,
                        dateLocal,
                        meal: item.meal,
                        grams: item.grams,
                      });
                    } else {
                      repo.addEntryFromRecipe({
                        recipeId: item.recipeId,
                        dateLocal,
                        meal: item.meal,
                        grams: item.grams,
                      });
                    }
                  }
                  refresh();
                  showFlash(`Повторили вчера · ${items.length}`);
                }
              : undefined
          }
          onOpenDiary={() => router.push('/(tabs)/food')}
        />

        <TodayPlanStrip />

        <View style={styles.quietCard}>
          <Pressable
            onPress={() => {
              repo.addWater(dateLocal, 250);
              refresh();
              showFlash('+250 мл воды');
            }}
            style={({ pressed }) => [styles.quietRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Вода ${waterLabel}. Добавить 250 миллилитров`}
          >
            <Ionicons name="water-outline" size={18} color={colors.text} />
            <Text style={styles.quietRowText}>Вода {waterLabel}</Text>
            <Text style={styles.quietRowAction}>+250 мл</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/progress')}
            style={({ pressed }) => [styles.quietRow, styles.quietRowBorder, pressed && styles.pressed]}
            accessibilityRole="link"
            accessibilityLabel="Привычки"
          >
            <Ionicons name="checkbox-outline" size={18} color={colors.text} />
            <Text style={styles.quietRowText}>
              {habitsTotal === 0
                ? 'Привычки'
                : `Привычки ${habitsDone}/${habitsTotal}`}
            </Text>
            <Text style={styles.quietRowAction}>→</Text>
          </Pressable>

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
        </View>

        <Pressable
          onPress={() => router.push('/plan/eat-now')}
          style={styles.secondaryLink}
          accessibilityRole="link"
          accessibilityLabel="Что съесть сейчас"
        >
          <Text style={styles.secondaryLinkText}>Что съесть сейчас →</Text>
        </Pressable>
      </FormScrollView>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerIcon, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.footerAdd, pressed && styles.pressed]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Добавить еду"
        >
          <Ionicons name="add" size={20} color={colors.primaryButtonText} />
          <Text style={styles.footerAddText}>Добавить еду</Text>
        </Pressable>
      </ScreenFooter>

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
  content: { padding: space.lg, paddingBottom: 140 },
  dateLine: {
    marginBottom: space.sm,
    fontSize: type.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  /** Outer slot only — KcalRing already paints its own surface (shared with Food). */
  ringCard: {
    marginBottom: space.sm,
  },
  quietCard: {
    ...surfaceCard,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    overflow: 'hidden',
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingVertical: space.sm,
  },
  quietRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  quietRowText: { flex: 1, fontSize: type.body, fontWeight: '600', color: colors.text },
  quietRowAction: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
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
    marginTop: space.sm,
  },
  secondaryLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footerIcon: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAdd: {
    flex: 1,
    minHeight: touchMin,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  footerAddText: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.primaryButtonText,
  },
  pressed: { opacity: 0.88 },
});
