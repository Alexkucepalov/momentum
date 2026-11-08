import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { monthKeyFromDateLocal } from '../../../../src/domain/foodBudget';
import type { FoodExpenseCategory } from '../../../../src/storage/types';
import { FormScrollView } from '@/src/components/FormScrollView';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';

const CATS: { id: FoodExpenseCategory; label: string }[] = [
  { id: 'groceries', label: 'Продукты' },
  { id: 'cafe', label: 'Кафе' },
  { id: 'office', label: 'Офис / обед' },
  { id: 'delivery', label: 'Доставка' },
];

/**
 * Budget: plan / fact / cart estimate / eaten estimate — never live store prices (N8/N9/N12).
 */
export default function BudgetScreen() {
  const { repo, dateLocal, refresh, showFlash } = useData();
  const revision = useAnyRevision();
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
    <FormScrollView contentContainerStyle={styles.content} testID="plan-budget">
      <AppText variant="body" tone="secondary" style={styles.lead}>
        Четыре разных числа: план (лимит), факт (твои расходы), корзина (оценка списка), съеденное
        (оценка по твоим ценам). Live-цен магазинов нет.
      </AppText>

      <AppText variant="title" style={styles.month}>
        {month}
      </AppText>

      <AppCard style={styles.hero} accessibilityLabel="Сводка бюджета месяца">
        <Metric
          label="План (лимит месяца)"
          value={snap.limitRub != null ? `${Math.round(snap.limitRub)} ₽` : 'не задан'}
          strong
        />
        <Metric
          label="Факт (чеки / расходы)"
          value={snap.spentRub != null ? `${Math.round(snap.spentRub)} ₽` : 'неизвестно'}
        />
        <Metric
          label="Корзина (открытые списки)"
          value={
            projected.totalRub != null
              ? `${Math.round(projected.totalRub)} ₽`
              : projected.knownSumRub != null
                ? `частично ~${Math.round(projected.knownSumRub)} ₽`
                : '—'
          }
          hint={projected.label}
        />
        <Metric
          label="Съеденное (оценка по твоим ценам)"
          value={
            eaten.totalRub != null
              ? `${Math.round(eaten.totalRub)} ₽`
              : eaten.knownSumRub != null
                ? `частично ~${Math.round(eaten.knownSumRub)} ₽ (${eaten.knownCount}/${eaten.totalCount})`
                : eaten.totalCount === 0
                  ? 'нет записей'
                  : 'нужны цены в покупках'
          }
        />
        <Metric
          label="Осталось к лимиту"
          value={snap.remainingRub != null ? `${Math.round(snap.remainingRub)} ₽` : '—'}
        />
        <AppText variant="caption" tone="muted" style={styles.hint}>
          Прогноз до конца месяца:{' '}
          {snap.forecastRub != null
            ? `~${Math.round(snap.forecastRub)} ₽`
            : 'Недостаточно данных'}
          {' · '}день {snap.daysElapsed} из {snap.daysInMonth}
          {snap.forecastRub == null
            ? snap.daysElapsed < 7
              ? ' · нужно ≥7 дней и хотя бы один расход'
              : ' · добавь расход, чтобы считать прогноз'
            : ''}
        </AppText>
      </AppCard>

      <AppText variant="label" tone="secondary">
        Лимит месяца
      </AppText>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        keyboardType="number-pad"
        style={styles.input}
        accessibilityLabel="Лимит бюджета питания"
      />
      <AppButton label="Сохранить лимит" onPress={saveLimit} />

      <AppText variant="label" tone="secondary" style={styles.section}>
        Добавить расход
      </AppText>
      <View style={styles.row}>
        {CATS.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            selected={category === c.id}
            onPress={() => setCategory(c.id)}
            accessibilityLabel={c.label}
          />
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
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
      <AppButton label="Записать расход" onPress={addExpense} />

      <AppText variant="label" tone="secondary" style={styles.section}>
        По категориям
      </AppText>
      {CATS.map((c) => (
        <AppText key={c.id} variant="body" style={styles.catLine}>
          {c.label}: {Math.round(byCat[c.id])} ₽
        </AppText>
      ))}

      <AppText variant="label" tone="secondary" style={styles.section}>
        Последние расходы
      </AppText>
      {expenses.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Пока пусто — запиши поход в магазин или обед.
        </AppText>
      ) : (
        expenses.slice(0, 12).map((e) => (
          <AppCard key={e.id} style={styles.card}>
            <View style={styles.cardMain}>
              <AppText variant="body" style={styles.cardTitle}>
                {Math.round(e.amountRub)} ₽ · {CATS.find((c) => c.id === e.category)?.label}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {e.spentOn}
              </AppText>
            </View>
            <AppButton
              label="Удалить"
              variant="secondary"
              onPress={() => {
                repo.softDeleteFoodExpense(e.id);
                refresh();
                showFlash('Расход удалён');
              }}
            />
          </AppCard>
        ))
      )}
    </FormScrollView>
  );
}

function Metric({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <AppText variant={strong ? 'metric' : 'subtitle'} style={styles.metricValue}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { lineHeight: 22 },
  month: { fontWeight: '800' },
  hero: { gap: space.md },
  metric: { gap: 2 },
  metricValue: { fontWeight: '700' },
  section: { marginTop: space.sm },
  input: {
    minHeight: touchMin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.ink,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hint: { lineHeight: 18 },
  catLine: { fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  cardMain: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: '700' },
});
