import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { monthKeyFromDateLocal } from '../../../../src/domain/foodBudget';
import type { FoodExpenseCategory } from '../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const CATS: { id: FoodExpenseCategory; label: string }[] = [
  { id: 'groceries', label: 'Продукты' },
  { id: 'cafe', label: 'Кафе' },
  { id: 'office', label: 'Офис / обед' },
  { id: 'delivery', label: 'Доставка' },
];

export default function BudgetScreen() {
  const { repo, dateLocal, refresh, revision, showFlash } = useData();
  void revision;

  const month = monthKeyFromDateLocal(dateLocal);
  const snap = repo.monthBudgetSnapshot(month, dateLocal);
  const eaten = repo.monthEatenCostEstimate(month);
  const projected = repo.openShoppingProjection();
  const expenses = repo.listFoodExpenses(month);

  const [limit, setLimit] = useState(snap.limitRub != null ? String(snap.limitRub) : '30000');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<FoodExpenseCategory>('groceries');
  const [error, setError] = useState<string | null>(null);

  const byCat = useMemo(() => {
    const map: Record<FoodExpenseCategory, number> = {
      groceries: 0,
      cafe: 0,
      office: 0,
      delivery: 0,
    };
    for (const e of expenses) map[e.category] += e.amountRub;
    return map;
  }, [expenses]);

  const saveLimit = () => {
    setError(null);
    try {
      const n = Number(limit.replace(',', '.'));
      if (!Number.isFinite(n) || n <= 0) throw new Error('Лимит: число > 0');
      repo.setFoodBudget(month, n);
      refresh();
      showFlash(`Лимит ${month}: ${Math.round(n)} ₽`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const addExpense = () => {
    setError(null);
    try {
      const n = Number(amount.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) throw new Error('Сумма: число ≥ 0');
      repo.addFoodExpense({
        amountRub: n,
        category,
        spentOn: dateLocal,
      });
      setAmount('');
      refresh();
      showFlash('Расход записан');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        План / факт / корзина — разные числа. Прогноз месяца только при достаточной истории.
      </Text>

      <Text style={styles.month}>{month}</Text>

      <View style={styles.hero} accessibilityRole="summary">
        <Text style={styles.heroLabel}>План на месяц</Text>
        <Text style={styles.heroValue}>
          {snap.limitRub != null ? `${Math.round(snap.limitRub)} ₽` : 'не задан'}
        </Text>

        <Text style={styles.metricLabel}>Фактически (чеки / расходы)</Text>
        <Text style={styles.heroRow}>
          {snap.spentRub != null ? `${Math.round(snap.spentRub)} ₽` : 'неизвестно'}
        </Text>

        <Text style={styles.metricLabel}>Прогноз корзины (открытые списки)</Text>
        <Text style={styles.heroRow}>
          {projected.totalRub != null
            ? `${Math.round(projected.totalRub)} ₽`
            : projected.knownSumRub != null
              ? `частично ~${Math.round(projected.knownSumRub)} ₽`
              : '—'}
        </Text>
        <Text style={styles.hint}>{projected.label}</Text>

        <Text style={styles.metricLabel}>Съеденное (оценка по вашим ценам)</Text>
        <Text style={styles.heroRow}>
          {eaten.totalRub != null
            ? `${Math.round(eaten.totalRub)} ₽`
            : eaten.knownSumRub != null
              ? `частично ~${Math.round(eaten.knownSumRub)} ₽ (${eaten.knownCount}/${eaten.totalCount})`
              : eaten.totalCount === 0
                ? 'нет записей'
                : 'нужны цены в покупках'}
        </Text>

        <Text style={styles.heroRow}>
          Осталось к лимиту:{' '}
          {snap.remainingRub != null ? `${Math.round(snap.remainingRub)} ₽` : '—'}
        </Text>
        <Text style={styles.heroRow}>
          Прогноз трат до конца месяца:{' '}
          {snap.forecastRub != null
            ? `~${Math.round(snap.forecastRub)} ₽`
            : 'Пока мало данных для прогноза'}
        </Text>
        <Text style={styles.hint}>
          День {snap.daysElapsed} из {snap.daysInMonth}
          {snap.forecastRub == null && snap.daysElapsed < 7
            ? ' · нужно ≥7 дней с расходами'
            : ''}
          {snap.incomplete ? ' · лимит или суммы неполные' : ''}
          {eaten.incomplete && eaten.totalCount > 0 ? ' · съеденное частично без цен' : ''}
        </Text>
      </View>

      <Text style={styles.section}>Лимит месяца</Text>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        keyboardType="number-pad"
        style={styles.input}
        accessibilityLabel="Лимит бюджета питания"
      />
      <PrimaryButton label="Сохранить лимит" onPress={saveLimit} />

      <Text style={styles.section}>Добавить расход</Text>
      <View style={styles.row}>
        {CATS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategory(c.id)}
            style={[styles.chip, category === c.id && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === c.id }}
            accessibilityLabel={c.label}
          >
            <Text style={[styles.chipText, category === c.id && styles.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Сумма ₽"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        style={styles.input}
        accessibilityLabel="Сумма расхода"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Записать расход" onPress={addExpense} />

      <Text style={styles.section}>По категориям</Text>
      {CATS.map((c) => (
        <Text key={c.id} style={styles.catLine}>
          {c.label}: {Math.round(byCat[c.id])} ₽
        </Text>
      ))}

      <Text style={styles.section}>Последние расходы</Text>
      {expenses.length === 0 ? (
        <Text style={styles.hint}>Пока пусто — запиши поход в магазин или обед.</Text>
      ) : (
        expenses.slice(0, 12).map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>
                {Math.round(e.amountRub)} ₽ · {CATS.find((c) => c.id === e.category)?.label}
              </Text>
              <Text style={styles.cardSub}>{e.spentOn}</Text>
            </View>
            <Pressable
              onPress={() => {
                repo.softDeleteFoodExpense(e.id);
                refresh();
                showFlash('Расход удалён');
              }}
              accessibilityRole="button"
              accessibilityLabel="Удалить расход"
            >
              <Text style={styles.delete}>Удалить</Text>
            </Pressable>
          </View>
        ))
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  month: { fontSize: type.title, fontWeight: '800', color: colors.text },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  heroLabel: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  heroValue: { fontSize: type.hero, fontWeight: '800', color: colors.text },
  metricLabel: {
    marginTop: space.sm,
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  heroRow: { fontSize: type.body, color: colors.text, fontWeight: '600' },
  section: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: space.sm,
  },
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
  error: { color: colors.danger, fontSize: type.caption },
  hint: { fontSize: type.caption, color: colors.textMuted },
  catLine: { fontSize: type.body, color: colors.text, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardMain: { flex: 1, gap: 2 },
  cardTitle: { fontSize: type.body, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: type.caption, color: colors.textSecondary },
  delete: { fontSize: type.caption, fontWeight: '700', color: colors.danger },
});
