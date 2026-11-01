import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';

import {
  buildHabitWeekMarks,
  formatHabitWeekLabel,
} from '../../../../src/domain/habitWeek';
import { localDateKey } from '../../../../src/storage/validation';
import type { FoodProduct } from '../../../../src/storage/types';
import { DayStrip } from '@/src/components/DayStrip';
import { DaySwipeArea } from '@/src/components/DaySwipeArea';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { KcalRing } from '@/src/components/KcalRing';
import { ScreenFooter } from '@/src/components/ScreenFooter';
import { SectionHeader } from '@/src/components/SectionHeader';
import { StatCards } from '@/src/components/StatCards';
import { TodayChecklist } from '@/src/components/TodayChecklist';
import { UndoBar } from '@/src/components/UndoBar';
import { DayCalendarSheet } from '@/src/features/calendar/DayCalendarSheet';
import { AddFoodSheet } from '@/src/features/diary/AddFoodSheet';
import { BarcodeLookupSheet } from '@/src/features/diary/BarcodeLookupSheet';
import {
  ConfirmPortionSheet,
  type PortionTarget,
} from '@/src/features/diary/ConfirmPortionSheet';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
  touchMin,
} from '@/src/design-system';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

const MEAL_RU = {
  breakfast: 'завтрак',
  lunch: 'обед',
  dinner: 'ужин',
  snack: 'перекус',
} as const;

/** Compact date line under tab title «Сегодня» — no second hero headline. */
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

/**
 * Today fold (Stage 4.1 / D1–D9):
 * date + DayStrip + KcalRing + compact water/activity · one primary Add · Plan in header.
 */
export default function TodayScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { repo, dateLocal, setDateLocal, meal, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [open, setOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [portionTarget, setPortionTarget] = useState<{
    target: PortionTarget;
    initialGrams: number;
  } | null>(null);

  const totals = repo.dailyTotals(dateLocal);
  const favorites = repo.listFavorites().slice(0, 3);
  const waterMl = repo.waterMlForDate(dateLocal);
  const profile = repo.getProfile();
  const today = localDateKey(new Date(), profile.timezone);
  const activityMinutes = repo.activityMinutesForDate(dateLocal);
  const activityKcal = repo.activityEnergyKcalForDate(dateLocal);
  const dateLine = formatDateLine(dateLocal, today);

  const flexibleRows = useMemo(() => {
    return repo
      .listFlexibleHabits()
      .filter((h) => h.pausedAt == null)
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/plan')}
          accessibilityRole="button"
          accessibilityLabel="План питания"
          style={styles.headerBtn}
          hitSlop={8}
        >
          <Ionicons name="compass-outline" size={22} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  return (
    <View style={styles.root} testID="today-screen">
      <DaySwipeArea dateLocal={dateLocal} onDateChange={setDateLocal}>
        <FormScrollView contentContainerStyle={styles.content}>
          <View style={styles.dateRow}>
            <AppText variant="body" tone="secondary" style={styles.dateLine}>
              {dateLine}
            </AppText>
            {dateLocal !== today ? (
              <Pressable
                onPress={() => setDateLocal(today)}
                accessibilityRole="button"
                accessibilityLabel="К сегодня"
                hitSlop={8}
                style={styles.todayJumpHit}
              >
                <AppText variant="caption" style={styles.todayJump}>
                  Сегодня
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <DayStrip
            selected={dateLocal}
            today={today}
            onSelect={setDateLocal}
            onOpenCalendar={() => setCalendarOpen(true)}
          />

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

          <StatCards
            waterMl={waterMl}
            waterTargetMl={profile.waterTargetMl}
            activityMinutes={activityMinutes}
            onAddWater={(ml) => {
              repo.addWater(dateLocal, ml);
              refresh();
              showFlash(`+${ml} мл воды`);
            }}
          />

          <TodayChecklist
            flexibleHabits={flexibleRows}
            onManageHabits={() => router.push('/progress')}
            onToggleFlexible={(habitId) => {
              const habit = repo.listFlexibleHabits().find((h) => h.id === habitId);
              if (repo.isFlexibleHabitLogged(habitId, dateLocal)) {
                repo.unlogFlexibleHabit(habitId, dateLocal);
                refresh();
                showFlash(habit ? `Снято: ${habit.name}` : 'Отметка снята');
              } else {
                repo.logFlexibleHabit(habitId, dateLocal);
                refresh();
                showFlash(habit ? `Отмечено: ${habit.name}` : 'Отмечено');
              }
            }}
          />

          {favorites.length > 0 ? (
            <View style={styles.favBlock}>
              <SectionHeader title="Избранное" />
              <AppText variant="caption" tone="muted" style={styles.favHint}>
                Порция подтверждается перед записью в дневник
              </AppText>
              {favorites.map((p) => {
                const lastG = repo.lastGramsForProduct(p.id) ?? 100;
                return (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [pressed && styles.pressed]}
                    onPress={() => {
                      setPortionTarget({
                        target: { kind: 'product', product: p },
                        initialGrams: lastG,
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Добавить ${p.name}, выбрать порцию`}
                  >
                    <AppCard style={styles.quick}>
                      <View style={styles.iconBubble}>
                        <Ionicons name="star" size={16} color={colors.fat} />
                      </View>
                      <View style={styles.quickBody}>
                        <AppText variant="body" style={styles.quickTitle}>
                          {p.name}
                        </AppText>
                        <AppText variant="caption" tone="secondary">
                          обычно {lastG} г → {MEAL_RU[meal]}
                          {p.energyKcal === null
                            ? ''
                            : ` · ~${Math.round((p.energyKcal * lastG) / 100)} ккал`}
                        </AppText>
                      </View>
                      <AppText variant="title">+</AppText>
                    </AppCard>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </FormScrollView>
      </DaySwipeArea>

      <ScreenFooter>
        <Pressable
          style={({ pressed }) => [styles.footerScan, pressed && styles.pressed]}
          onPress={() => setBarcodeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Сканировать штрихкод"
        >
          <Ionicons name="barcode-outline" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.footerBtn}>
          <AppButton label="Добавить еду" onPress={() => setOpen(true)} />
        </View>
      </ScreenFooter>

      <AddFoodSheet visible={open} onClose={() => setOpen(false)} />
      <BarcodeLookupSheet visible={barcodeOpen} onClose={() => setBarcodeOpen(false)} />
      <DayCalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <ConfirmPortionSheet
        visible={portionTarget != null}
        target={portionTarget?.target ?? null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={portionTarget?.initialGrams}
        onClose={() => setPortionTarget(null)}
        onConfirm={(result) => {
          if (!portionTarget || portionTarget.target.kind !== 'product') return;
          if (!allowAdd()) return;
          const product = portionTarget.target.product as FoodProduct;
          repo.updateProductNutrition(product.id, result.per100g);
          repo.addEntryFromProduct({
            productId: product.id,
            dateLocal,
            meal,
            grams: result.grams,
          });
          refresh();
          setPortionTarget(null);
          showFlash(`Добавлено: ${product.name}`);
        }}
      />
      <FlashBar />
      <UndoBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg, paddingBottom: 140, gap: space.sm },
  headerBtn: {
    minWidth: touchMin,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  dateLine: {
    flex: 1,
    fontWeight: '600',
  },
  todayJumpHit: { minHeight: touchMin, justifyContent: 'center' },
  todayJump: {
    fontWeight: '700',
    color: colors.ink,
  },
  favBlock: { marginTop: space.md, gap: space.xs },
  favHint: { marginBottom: space.sm },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    marginBottom: space.sm,
    minHeight: touchMin,
    gap: space.sm,
  },
  pressed: { opacity: 0.88 },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBody: { flex: 1 },
  quickTitle: { fontWeight: '600' },
  footerScan: {
    width: touchMin,
    height: touchMin,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: { flex: 1 },
});
