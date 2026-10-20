import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type DraftLine = { name: string; amountRub: string };

/**
 * Manual receipt lines — user confirms every amount.
 * No OCR/scrape; photo path deferred until legal pipeline exists.
 */
export default function ReceiptStubScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  const [lines, setLines] = useState<DraftLine[]>([{ name: '', amountRub: '' }]);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => setLines((prev) => [...prev, { name: '', amountRub: '' }]);

  const save = () => {
    setError(null);
    try {
      const parsed: { name: string; amount: number }[] = [];
      for (const line of lines) {
        const name = line.name.trim();
        const raw = line.amountRub.trim();
        if (!name && !raw) continue;
        if (!name) throw new Error('Укажи название позиции');
        const amount = Number(raw.replace(',', '.'));
        if (!Number.isFinite(amount) || amount < 0) throw new Error(`Сумма для «${name}»: число ≥ 0`);
        parsed.push({ name, amount });
      }
      if (parsed.length === 0) throw new Error('Добавь хотя бы одну строку чека');

      // Only record spent money — do not invent ₽/кг from line totals without mass.
      const total = parsed.reduce((s, p) => s + p.amount, 0);
      repo.addFoodExpense({
        amountRub: total,
        category: 'groceries',
        spentOn: dateLocal,
        note: `Чек · ${parsed.map((p) => p.name).join(', ')}`.slice(0, 160),
      });
      refresh();
      showFlash(`Чек: ${Math.round(total)} ₽`);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Введи строки вручную и подтверди суммы. Фото/OCR и live-цены магазинов — только после
        разрешённых источников (ADR-008). Ничего не угадываем.
      </Text>

      {lines.map((line, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            value={line.name}
            onChangeText={(t) =>
              setLines((prev) => prev.map((l, j) => (j === i ? { ...l, name: t } : l)))
            }
            placeholder="Позиция"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.name]}
            accessibilityLabel={`Позиция ${i + 1}`}
          />
          <TextInput
            value={line.amountRub}
            onChangeText={(t) =>
              setLines((prev) => prev.map((l, j) => (j === i ? { ...l, amountRub: t } : l)))
            }
            placeholder="₽"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, styles.amount]}
            accessibilityLabel={`Сумма позиции ${i + 1}`}
          />
        </View>
      ))}

      <Pressable onPress={addRow} accessibilityRole="button" accessibilityLabel="Добавить строку">
        <Text style={styles.add}>+ Строка</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Сохранить чек" onPress={save} />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', gap: space.sm },
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
  name: { flex: 1 },
  amount: { width: 96 },
  add: { fontSize: type.body, fontWeight: '700', color: colors.accent },
  error: { color: colors.danger, fontSize: type.caption },
});
