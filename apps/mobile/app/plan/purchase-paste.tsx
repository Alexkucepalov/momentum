import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Switch } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import type { Purchase, PurchaseLine } from '../../../../src/storage/types';

type EditableLine = PurchaseLine & {
  editing: boolean;
};

export default function PurchasePasteScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const [pasteText, setPasteText] = useState('');
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');

  const handleParse = () => {
    setError(null);
    try {
      if (!pasteText.trim()) {
        throw new Error('Вставь текст покупки');
      }
      
      const result = repo.createPurchaseFromText({ text: pasteText });
      setPurchase(result.purchase);
      setLines(result.lines.map(l => ({ ...l, editing: false })));
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка парсинга');
    }
  };

  const handleConfirm = () => {
    setError(null);
    try {
      if (!purchase) throw new Error('Нет покупки для подтверждения');
      
      lines.forEach(line => {
        repo.updatePurchaseLine(line.id, {
          displayName: line.displayName,
          quantity: line.quantity,
          unit: line.unit,
          excluded: line.excluded,
          lineTotalRub: line.lineTotalRub,
        });
      });
      
      const result = repo.confirmPurchase(purchase.id, { status: 'delivered' });
      
      refresh();
      showFlash(
        `Добавлено: ${result.pantryItems.length} позиций в запасы` +
        (result.expense ? `, ${Math.round(result.expense.amountRub)} ₽` : '')
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка подтверждения');
    }
  };

  const updateLine = (index: number, updates: Partial<EditableLine>) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...updates } : l));
  };

  if (step === 'paste') {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Вставь текст покупки из магазина. Парсер извлечёт продукты, количество и цены.
          Всё можно будет отредактировать на следующем шаге.
        </Text>

        <TextInput
          value={pasteText}
          onChangeText={setPasteText}
          placeholder={`Пример:\nМолоко 1л 89₽\nХлеб 500г 45₽\nИТОГО: 134₽`}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={10}
          style={styles.textArea}
          accessibilityLabel="Текст покупки"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Разобрать →" onPress={handleParse} />
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Отмена</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Проверь и отредактируй позиции. Убери галочку с непродовольственных товаров.
      </Text>

      {purchase && (
        <View style={styles.summaryCard}>
          {purchase.storeLabel && <Text style={styles.summaryLabel}>Магазин: {purchase.storeLabel}</Text>}
          {purchase.totalRub !== null && (
            <Text style={styles.summaryLabel}>Итого: {Math.round(purchase.totalRub)} ₽</Text>
          )}
          <Text style={styles.summaryMeta}>
            {lines.filter(l => !l.excluded && l.isFood).length} позиций для запасов
          </Text>
        </View>
      )}

      {lines.map((line, index) => (
        <View key={line.id} style={[styles.lineCard, line.excluded && styles.lineCardExcluded]}>
          <View style={styles.lineHeader}>
            <Switch
              value={!line.excluded}
              onValueChange={v => updateLine(index, { excluded: !v })}
              accessibilityLabel={`Включить ${line.displayName}`}
            />
            <Text style={[styles.lineName, line.excluded && styles.lineNameExcluded]}>
              {line.displayName}
            </Text>
          </View>

          {!line.excluded && (
            <View style={styles.lineDetails}>
              {line.quantity !== null && line.unit && (
                <Text style={styles.lineDetail}>
                  {line.quantity} {line.unit}
                </Text>
              )}
              {line.lineTotalRub !== null && (
                <Text style={styles.lineDetail}>{Math.round(line.lineTotalRub)} ₽</Text>
              )}
              {!line.isFood && (
                <Text style={styles.lineWarning}>Не еда</Text>
              )}
            </View>
          )}
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Подтвердить покупку" onPress={handleConfirm} />
      <Pressable onPress={() => setStep('paste')} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>← Назад к вставке</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  textArea: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
    textAlignVertical: 'top',
  },
  summaryCard: {
    padding: space.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    gap: space.xs,
  },
  summaryLabel: { fontSize: type.body, fontWeight: '600', color: colors.text },
  summaryMeta: { fontSize: type.caption, color: colors.textSecondary },
  lineCard: {
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  lineCardExcluded: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  lineName: {
    flex: 1,
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
  },
  lineNameExcluded: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  lineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginLeft: 56,
  },
  lineDetail: {
    fontSize: type.caption,
    color: colors.textSecondary,
  },
  lineWarning: {
    fontSize: type.caption,
    color: colors.danger,
    fontWeight: '600',
  },
  error: { color: colors.danger, fontSize: type.caption },
  cancelBtn: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: type.body,
    color: colors.textMuted,
  },
});
