import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { MealPlanPeriodDays, MealPlanDiversity } from '../../../../src/domain/mealPlanDraft';
import type { MealSlot, PlannedMeal } from '../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const PERIODS: MealPlanPeriodDays[] = [3, 5, 7];
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

  const plans = repo.listMealPlans();
  const activeId = planId ?? plans.find((p) => p.status === 'draft' || p.status === 'active')?.id ?? null;
  const plan = activeId ? repo.getMealPlan(activeId) : null;
  const meals = activeId ? repo.listPlannedMeals(activeId) : [];
  const daysGrouped = useMemo(() => groupByDate(meals), [meals]);

  const createDraft = () => {
    setError(null);
    try {
      const recipes = repo.listRecipes();
      if (recipes.length === 0) {
        setError('Нужен хотя бы один рецепт — иначе план будет пустым.');
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
      refresh();
      showFlash('Черновик меню создан — ещё не съедено');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <View style={styles.banner} accessibilityRole="summary">
        <Text style={styles.bannerText}>Запланированное не считается съеденным.</Text>
      </View>

      <Text style={styles.section}>Создать меню</Text>
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

      <Text style={styles.label}>Бюджет на продукты (₽, опционально)</Text>
      <TextInput
        value={budget}
        onChangeText={setBudget}
        keyboardType="number-pad"
        placeholder="3500"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel="Бюджет на продукты"
      />

      <Text style={styles.label}>Готовок в неделю</Text>
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
      <PrimaryButton label="Спроектировать такой план" onPress={createDraft} />

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

      {plan ? (
        <>
          <Text style={styles.section}>
            План {plan.startDate} → {plan.endDate} · {plan.status}
            {plan.budgetRub != null ? ` · ~${Math.round(plan.budgetRub)} ₽` : ''}
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
              onPress={() => {
                repo.softDeleteMealPlan(plan.id);
                setPlanId(null);
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

          {daysGrouped.length === 0 ? (
            <Text style={styles.hint}>Пустой черновик — добавь рецепты и создай снова.</Text>
          ) : (
            daysGrouped.map(({ date, items }) => (
              <View key={date} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>{date}</Text>
                {items.map((m) => (
                  <PlannedMealRow
                    key={m.id}
                    meal={m}
                    onPortion={() => {
                      const next = m.grams >= 200 ? 150 : m.grams + 50;
                      repo.updatePlannedMealGrams(m.id, next);
                      refresh();
                    }}
                    onMove={() => {
                      const nextMeal: MealSlot =
                        m.meal === 'breakfast' ? 'lunch' : m.meal === 'lunch' ? 'dinner' : 'breakfast';
                      repo.movePlannedMeal(m.id, { dateLocal: m.dateLocal, meal: nextMeal });
                      refresh();
                      showFlash(`Перенесено → ${MEAL_LABELS[nextMeal]}`);
                    }}
                    onReplace={() => {
                      const recipes = repo.listRecipes();
                      if (recipes.length < 2) {
                        showFlash('Нужно ≥2 рецепта для замены');
                        return;
                      }
                      const other = recipes.find((r) => r.id !== m.recipeId) ?? recipes[0]!;
                      repo.replacePlannedMeal(m.id, {
                        recipeId: other.id,
                        displayName: other.name,
                        grams: Math.min(200, Math.round(other.cookedYieldG / 4)),
                      });
                      refresh();
                      showFlash(`Заменено: ${other.name}`);
                    }}
                    onLog={() => {
                      repo.logPlannedMealToDiary(m.id);
                      refresh();
                      showFlash(`В дневник: ${m.displayName}`);
                    }}
                  />
                ))}
              </View>
            ))
          )}
        </>
      ) : (
        <Text style={styles.hint}>Черновика ещё нет — нажми «Спроектировать».</Text>
      )}
    </FormScrollView>
  );
}

function PlannedMealRow({
  meal: m,
  onPortion,
  onMove,
  onReplace,
  onLog,
}: {
  meal: PlannedMeal;
  onPortion: () => void;
  onMove: () => void;
  onReplace: () => void;
  onLog: () => void;
}) {
  return (
    <View style={styles.mealCard} accessibilityRole="summary">
      <Text style={styles.mealSlot}>{MEAL_LABELS[m.meal]}</Text>
      <Text style={styles.mealTitle}>{m.displayName}</Text>
      <Text style={styles.mealMeta}>
        {Math.round(m.grams)} г
        {m.status === 'logged' ? ' · уже в дневнике' : ' · только план'}
      </Text>
      {m.status !== 'logged' ? (
        <View style={styles.actions}>
          <Action label="Порция" onPress={onPortion} />
          <Action label="Слот" onPress={onMove} />
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
  },
  bannerText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
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
