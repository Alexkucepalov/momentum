import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatDateRu } from '../../../../src/domain/dateFormatRu';
import type { MealPlanPeriodDays, MealPlanDiversity } from '../../../../src/domain/mealPlanDraft';
import { shiftDateLocal } from '../../../../src/domain/repeatMeal';
import { nutritionForRecipePortion } from '../../../../src/domain/recipeNutrition';
import type { MealSlot, PlannedMeal } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const PERIODS: MealPlanPeriodDays[] = [3, 5, 7];
const PORTION_STEPS = [100, 150, 200, 250, 300];
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

function groupByDate(meals: PlannedMeal[]): Array<{ date: string; items: PlannedMeal[] }> {
  const map = new Map<string, PlannedMeal[]>();
  for (const m of meals) {
    const list = map.get(m.dateLocal) ?? [];
    list.push(m);
    map.set(m.dateLocal, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}

function fmtMacroLine(kcal: number | null, p: number | null, f: number | null, c: number | null): string {
  const parts: string[] = [];
  if (kcal !== null) parts.push(`${Math.round(kcal)} ккал`);
  if (p !== null) parts.push(`Б ${Math.round(p)}`);
  if (f !== null) parts.push(`Ж ${Math.round(f)}`);
  if (c !== null) parts.push(`У ${Math.round(c)}`);
  return parts.length ? parts.join(' · ') : 'КБЖУ неизвестны';
}

export default function WeekPlanScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, revision, showFlash } = useData();
  void revision;

  const [days, setDays] = useState<MealPlanPeriodDays>(7);
  const [budget, setBudget] = useState('3500');
  const [cookSessions, setCookSessions] = useState('2');
  const [diversity, setDiversity] = useState<MealPlanDiversity>('balanced');
  const [planId, setPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const plans = repo.listMealPlans().filter((p) => p.status !== 'archived');
  const activeId =
    planId ?? plans.find((p) => p.status === 'draft' || p.status === 'active')?.id ?? null;
  const plan = activeId ? repo.getMealPlan(activeId) : null;
  const meals = activeId ? repo.listPlannedMeals(activeId) : [];
  const daysGrouped = useMemo(() => groupByDate(meals), [meals]);

  const showComposer = composerOpen || !plan;

  const createDraft = () => {
    setError(null);
    try {
      if (repo.listRecipes().length === 0) {
        setError('Нужен хотя бы один рецепт — иначе план будет пустым.');
        return;
      }
      const budgetRub = budget.trim() === '' ? null : Number(budget.replace(',', '.'));
      if (budgetRub !== null && (!Number.isFinite(budgetRub) || budgetRub < 0)) {
        throw new Error('Бюджет: число ≥ 0 или пусто');
      }
      const sessions = Number(cookSessions);
      if (!Number.isInteger(sessions) || sessions < 1) throw new Error('Готовок: целое ≥ 1');
      const created = repo.createMealPlanDraft({
        startDateLocal: dateLocal,
        days,
        budgetRub,
        cookSessions: sessions,
        diversity,
      });
      setPlanId(created.id);
      setComposerOpen(false);
      refresh();
      showFlash('Черновик меню готов — ещё не съедено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план');
    }
  };

  const macrosFor = (m: PlannedMeal): string => {
    if (!m.recipeId) return 'КБЖУ неизвестны';
    const recipe = repo.getRecipe(m.recipeId);
    if (!recipe) return 'КБЖУ неизвестны';
    const n = nutritionForRecipePortion(recipe, repo.getRecipeIngredients(recipe.id), m.grams);
    return fmtMacroLine(n.kcal, n.protein, n.fat, n.carbs);
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <View style={styles.banner} accessibilityRole="summary">
        <Text style={styles.bannerText}>Запланированное не считается съеденным.</Text>
        <Text style={styles.bannerSub}>
          Меню — черновик быта: переставь, поменяй порцию, а в дневник только когда реально съел.
        </Text>
      </View>

      {plan ? (
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>
            {formatDateRu(plan.startDate)} — {formatDateRu(plan.endDate)}
          </Text>
          <Text style={styles.planMeta}>
            {plan.status === 'draft' ? 'черновик' : plan.status === 'active' ? 'активный' : plan.status}
            {plan.cookSessions != null ? ` · ${plan.cookSessions} готовок` : ''}
            {plan.budgetRub != null ? ` · ориентир ${Math.round(plan.budgetRub)} ₽` : ''}
          </Text>
          <View style={styles.row}>
            {plan.status === 'draft' ? (
              <Pressable
                onPress={() => {
                  repo.activateMealPlan(plan.id);
                  refresh();
                  showFlash('План активирован');
                }}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel="Активировать план"
              >
                <Text style={styles.chipText}>Активировать</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push('/plan/shop')}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel="Собрать покупки"
            >
              <Text style={styles.chipText}>Покупки</Text>
            </Pressable>
            <Pressable
              onPress={() => setComposerOpen((v) => !v)}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel="Новый черновик"
            >
              <Text style={styles.chipText}>{composerOpen ? 'Скрыть форму' : 'Новый черновик'}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                repo.softDeleteMealPlan(plan.id);
                setPlanId(null);
                setComposerOpen(true);
                refresh();
                showFlash('План удалён');
              }}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel="Удалить план"
            >
              <Text style={[styles.chipText, styles.danger]}>Удалить</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showComposer ? (
        <View style={styles.composer}>
          <Text style={styles.section}>Собрать меню из твоих рецептов</Text>
          <Text style={styles.label}>Период</Text>
          <View style={styles.row}>
            {PERIODS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setDays(p)}
                style={[styles.chip, days === p && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: days === p }}
                accessibilityLabel={`${p} дней`}
              >
                <Text style={[styles.chipText, days === p && styles.chipTextOn]}>{p} дн.</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Ориентир бюджета (₽, не списывается)</Text>
          <TextInput
            value={budget}
            onChangeText={setBudget}
            keyboardType="number-pad"
            placeholder="3500"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="Бюджет на продукты"
          />

          <Text style={styles.label}>Готовок (сколько раз готовишь за период)</Text>
          <TextInput
            value={cookSessions}
            onChangeText={setCookSessions}
            keyboardType="number-pad"
            style={styles.input}
            accessibilityLabel="Число готовок"
          />

          <Text style={styles.label}>Разнообразие</Text>
          <View style={styles.row}>
            {(
              [
                ['balanced', 'Сбалансированное'],
                ['fewer', 'Меньше блюд'],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => setDiversity(id)}
                style={[styles.chip, diversity === id && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: diversity === id }}
                accessibilityLabel={label}
              >
                <Text style={[styles.chipText, diversity === id && styles.chipTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Спроектировать план" onPress={createDraft} />
          {repo.listRecipes().length === 0 ? (
            <EmptyState
              compact
              icon="book-outline"
              title="Нет рецептов"
              body="Добавь рецепты — черновик меню собирается из личной базы."
              actionLabel="К рецептам"
              onAction={() => router.push('/recipes')}
            />
          ) : null}
        </View>
      ) : null}

      {plan && daysGrouped.length === 0 ? (
        <Text style={styles.hint}>Пустой черновик — добавь рецепты и создай снова.</Text>
      ) : null}

      {daysGrouped.map(({ date, items }) => {
        const isToday = date === dateLocal;
        return (
          <View key={date} style={[styles.dayBlock, isToday && styles.dayToday]}>
            <Text style={styles.dayTitle}>
              {formatDateRu(date)}
              {isToday ? ' · сегодня' : ''}
            </Text>
            {items.map((m) => (
              <PlannedMealRow
                key={m.id}
                meal={m}
                macros={macrosFor(m)}
                onPortion={() => {
                  const idx = PORTION_STEPS.findIndex((g) => g >= m.grams);
                  const next =
                    idx < 0 || idx === PORTION_STEPS.length - 1
                      ? PORTION_STEPS[0]!
                      : PORTION_STEPS[idx + 1]!;
                  repo.updatePlannedMealGrams(m.id, next);
                  refresh();
                  showFlash(`Порция ${next} г`);
                }}
                onMoveDay={(delta) => {
                  const nextDate = shiftDateLocal(m.dateLocal, delta);
                  if (plan && (nextDate < plan.startDate || nextDate > plan.endDate)) {
                    showFlash('Вне периода плана');
                    return;
                  }
                  repo.movePlannedMeal(m.id, { dateLocal: nextDate, meal: m.meal });
                  refresh();
                  showFlash(`→ ${formatDateRu(nextDate)}`);
                }}
                onMoveSlot={() => {
                  const nextMeal: MealSlot =
                    m.meal === 'breakfast' ? 'lunch' : m.meal === 'lunch' ? 'dinner' : 'breakfast';
                  repo.movePlannedMeal(m.id, { dateLocal: m.dateLocal, meal: nextMeal });
                  refresh();
                  showFlash(`→ ${MEAL_LABELS[nextMeal]}`);
                }}
                onReplace={() => {
                  const recipes = repo.listRecipes();
                  if (recipes.length < 2) {
                    showFlash('Нужно ≥2 рецепта для замены');
                    return;
                  }
                  const ids = recipes.map((r) => r.id);
                  const cur = m.recipeId ? ids.indexOf(m.recipeId) : -1;
                  const other = recipes[(cur + 1) % recipes.length]!;
                  repo.replacePlannedMeal(m.id, {
                    recipeId: other.id,
                    displayName: other.name,
                    grams: Math.min(200, Math.max(100, Math.round(other.cookedYieldG / 4))),
                  });
                  refresh();
                  showFlash(`Замена: ${other.name}`);
                }}
                onLog={() => {
                  repo.logPlannedMealToDiary(m.id);
                  refresh();
                  showFlash(`В дневник: ${m.displayName}`);
                }}
              />
            ))}
          </View>
        );
      })}

      {!plan && !showComposer ? (
        <Text style={styles.hint}>Черновика ещё нет — открой форму выше.</Text>
      ) : null}
    </FormScrollView>
  );
}

function PlannedMealRow({
  meal: m,
  macros,
  onPortion,
  onMoveDay,
  onMoveSlot,
  onReplace,
  onLog,
}: {
  meal: PlannedMeal;
  macros: string;
  onPortion: () => void;
  onMoveDay: (delta: number) => void;
  onMoveSlot: () => void;
  onReplace: () => void;
  onLog: () => void;
}) {
  return (
    <View style={styles.mealCard} accessibilityRole="summary">
      <Text style={styles.mealSlot}>{MEAL_LABELS[m.meal]}</Text>
      <Text style={styles.mealTitle}>{m.displayName}</Text>
      <Text style={styles.mealMeta}>
        {Math.round(m.grams)} г · {macros}
        {m.status === 'logged' ? ' · в дневнике' : ''}
      </Text>
      {m.status !== 'logged' ? (
        <View style={styles.actions}>
          <Action label="Порция" onPress={onPortion} />
          <Action label="← день" onPress={() => onMoveDay(-1)} />
          <Action label="день →" onPress={() => onMoveDay(1)} />
          <Action label="Слот" onPress={onMoveSlot} />
          <Action label="Замена" onPress={onReplace} />
          <Action label="В дневник" onPress={onLog} primary />
        </View>
      ) : null}
    </View>
  );
}

function Action({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionBtn, primary && styles.actionPrimary]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  bannerText: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  bannerSub: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  planHeader: { gap: space.sm },
  planTitle: { fontSize: type.title, fontWeight: '800', color: colors.text },
  planMeta: { fontSize: type.caption, color: colors.textSecondary },
  composer: { gap: space.md },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  label: { fontSize: type.caption, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  chipTextOn: { color: colors.primaryButtonText },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: type.caption },
  danger: { color: colors.danger },
  hint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
  dayBlock: { gap: space.sm, marginTop: space.sm },
  dayToday: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: space.md,
  },
  dayTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  mealSlot: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  mealTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  mealMeta: { fontSize: type.caption, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  actionBtn: {
    minHeight: 36,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  actionTextPrimary: { color: colors.primaryButtonText },
});
