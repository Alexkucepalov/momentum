import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { parsePurchasePaste, type ParsedPurchaseLineDraft } from '../../../../src/domain/parsePurchasePaste';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type Step = 'input' | 'preview';

type PreviewLine = ParsedPurchaseLineDraft & { key: string };

function toPreviewLines(lines: ParsedPurchaseLineDraft[]): PreviewLine[] {
  return lines.map((l, i) => ({ ...l, key: `l-${i}-${l.displayName}` }));
}

/**
 * Purchase import slice 1: paste or manual lines → editable preview → confirm.
 * No OCR / cloud AI. Unconfirmed draft never writes pantry.
 */
export default function PurchaseImportScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  const [step, setStep] = useState<Step>('input');
  const [mode, setMode] = useState<'paste' | 'manual'>('paste');
  const [paste, setPaste] = useState('');
  const [manualLines, setManualLines] = useState([{ name: '', amountRub: '', qty: '' }]);
  const [storeLabel, setStoreLabel] = useState('');
  const [totalRub, setTotalRub] = useState('');
  const [lines, setLines] = useState<PreviewLine[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<'delivered' | 'fiscal_receipt'>('delivered');

  const knownExpense = useMemo(() => {
    const fromTotal = totalRub.trim() ? Number(totalRub.replace(',', '.')) : null;
    if (fromTotal != null && Number.isFinite(fromTotal) && fromTotal >= 0) return fromTotal;
    let sum = 0;
    let known = 0;
    for (const l of lines) {
      if (l.excluded || l.lineTotalRub == null) continue;
      sum += l.lineTotalRub;
      known += 1;
    }
    return known === 0 ? null : sum;
  }, [lines, totalRub]);

  const goPreviewFromPaste = () => {
    setError(null);
    const parsed = parsePurchasePaste(paste);
    if (parsed.lines.length === 0) {
      setError(parsed.warnings[0] ?? 'Нет позиций');
      return;
    }
    setStoreLabel(parsed.storeLabel ?? '');
    setTotalRub(parsed.totalRub != null ? String(parsed.totalRub) : '');
    setLines(toPreviewLines(parsed.lines));
    setWarnings(parsed.warnings);
    setParseConfidence(parsed.parseConfidence);
    setStep('preview');
  };

  const goPreviewFromManual = () => {
    setError(null);
    try {
      const next: ParsedPurchaseLineDraft[] = [];
      for (const row of manualLines) {
        const name = row.name.trim();
        const rawAmt = row.amountRub.trim();
        const rawQty = row.qty.trim();
        if (!name && !rawAmt && !rawQty) continue;
        if (!name) throw new Error('Укажи название позиции');
        const amount = rawAmt ? Number(rawAmt.replace(',', '.')) : null;
        if (rawAmt && (amount == null || !Number.isFinite(amount) || amount < 0)) {
          throw new Error(`Сумма для «${name}»: число ≥ 0 или пусто`);
        }
        const qty = rawQty ? Number(rawQty.replace(',', '.')) : null;
        if (rawQty && (qty == null || !Number.isFinite(qty) || qty < 0)) {
          throw new Error(`Количество для «${name}»: число ≥ 0 или пусто`);
        }
        next.push({
          rawName: name,
          displayName: name,
          quantity: qty,
          unit: qty != null ? 'pcs' : null,
          packageSizeText: null,
          unitPriceRub: null,
          lineTotalRub: amount,
          discountRub: null,
          isFood: true,
          excluded: false,
        });
      }
      if (next.length === 0) throw new Error('Добавь хотя бы одну строку');
      setLines(toPreviewLines(next));
      setWarnings([]);
      setParseConfidence(null);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const confirm = () => {
    setError(null);
    try {
      const total = totalRub.trim() ? Number(totalRub.replace(',', '.')) : null;
      if (totalRub.trim() && (total == null || !Number.isFinite(total) || total < 0)) {
        throw new Error('Итого: число ≥ 0 или пусто');
      }
      const result = repo.confirmNewPurchase({
        status: confirmStatus,
        sourceKind: mode === 'paste' ? 'paste' : 'manual',
        purchasedOn: dateLocal,
        storeLabel: storeLabel.trim() || null,
        totalRub: total,
        parseConfidence,
        lines: lines.map((l) => ({
          rawName: l.rawName,
          displayName: l.displayName,
          quantity: l.quantity,
          unit: l.unit,
          packageSizeText: l.packageSizeText,
          unitPriceRub: l.unitPriceRub,
          lineTotalRub: l.lineTotalRub,
          discountRub: l.discountRub,
          isFood: l.isFood,
          excluded: l.excluded,
        })),
      });
      refresh();
      const pantryN = result.pantryItems.length;
      const exp = result.expense ? `${Math.round(result.expense.amountRub)} ₽` : 'без суммы';
      showFlash(`Покупка: ${pantryN} в запасы · ${exp}`);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  if (step === 'preview') {
    return (
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Проверь позиции до подтверждения. Черновик не пишется в запасы. Null-цены не становятся 0.
        </Text>

        <TextInput
          value={storeLabel}
          onChangeText={setStoreLabel}
          placeholder="Магазин (необязательно)"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          accessibilityLabel="Магазин"
        />
        <TextInput
          value={totalRub}
          onChangeText={setTotalRub}
          placeholder="Итого ₽ (пусто = сумма известных строк)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.input}
          accessibilityLabel="Итого рублей"
        />

        <View style={styles.statusRow}>
          {(['delivered', 'fiscal_receipt'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setConfirmStatus(s)}
              style={[styles.chip, confirmStatus === s && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: confirmStatus === s }}
              accessibilityLabel={s === 'delivered' ? 'Доставлено' : 'Фискальный чек'}
            >
              <Text style={styles.chipText}>{s === 'delivered' ? 'Доставлено' : 'Фискальный чек'}</Text>
            </Pressable>
          ))}
        </View>

        {lines.map((line, i) => (
          <View key={line.key} style={styles.card}>
            <TextInput
              value={line.displayName}
              onChangeText={(t) =>
                setLines((prev) => prev.map((l, j) => (j === i ? { ...l, displayName: t } : l)))
              }
              style={styles.input}
              accessibilityLabel={`Название позиции ${i + 1}`}
            />
            <View style={styles.row}>
              <TextInput
                value={line.quantity == null ? '' : String(line.quantity)}
                onChangeText={(t) => {
                  const v = t.trim();
                  const n = v ? Number(v.replace(',', '.')) : null;
                  setLines((prev) =>
                    prev.map((l, j) =>
                      j === i
                        ? {
                            ...l,
                            quantity: v && (n == null || !Number.isFinite(n)) ? l.quantity : n,
                          }
                        : l,
                    ),
                  );
                }}
                placeholder="Кол-во"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.half]}
                accessibilityLabel={`Количество ${i + 1}`}
              />
              <TextInput
                value={line.lineTotalRub == null ? '' : String(line.lineTotalRub)}
                onChangeText={(t) => {
                  const v = t.trim();
                  const n = v ? Number(v.replace(',', '.')) : null;
                  setLines((prev) =>
                    prev.map((l, j) =>
                      j === i
                        ? {
                            ...l,
                            lineTotalRub: v && (n == null || !Number.isFinite(n)) ? l.lineTotalRub : n,
                          }
                        : l,
                    ),
                  );
                }}
                placeholder="₽"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.half]}
                accessibilityLabel={`Сумма ${i + 1}`}
              />
            </View>
            <View style={styles.row}>
              <Pressable
                onPress={() =>
                  setLines((prev) =>
                    prev.map((l, j) => (j === i ? { ...l, excluded: !l.excluded } : l)),
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: line.excluded }}
                accessibilityLabel={`Исключить позицию ${i + 1}`}
              >
                <Text style={styles.link}>{line.excluded ? 'Исключено' : 'Исключить'}</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setLines((prev) =>
                    prev.map((l, j) => (j === i ? { ...l, isFood: !l.isFood } : l)),
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: line.isFood }}
                accessibilityLabel={`Еда позиция ${i + 1}`}
              >
                <Text style={styles.link}>{line.isFood ? 'Еда → запасы' : 'Не еда'}</Text>
              </Pressable>
            </View>
            {line.unit ? (
              <Text style={styles.meta}>
                ед.: {line.unit}
                {line.packageSizeText ? ` · ${line.packageSizeText}` : ''}
              </Text>
            ) : null}
          </View>
        ))}

        {warnings.map((w) => (
          <Text key={w} style={styles.warn}>
            {w}
          </Text>
        ))}

        <Text style={styles.meta}>
          Расход: {knownExpense == null ? 'неизвестен (null)' : `${Math.round(knownExpense)} ₽`} · в запасы:{' '}
          {lines.filter((l) => !l.excluded && l.isFood).length}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Подтвердить покупку" onPress={confirm} />
        <Pressable onPress={() => setStep('input')} accessibilityRole="button" accessibilityLabel="Назад к вводу">
          <Text style={styles.back}>← Изменить ввод</Text>
        </Pressable>
      </FormScrollView>
    );
  }

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Вставь текст заказа или введи строки вручную. Фото/OCR — позже. Без подтверждения запасы не
        меняются.
      </Text>

      <View style={styles.statusRow}>
        <Pressable
          onPress={() => setMode('paste')}
          style={[styles.chip, mode === 'paste' && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'paste' }}
          accessibilityLabel="Вставить текст"
        >
          <Text style={styles.chipText}>Текст заказа</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('manual')}
          style={[styles.chip, mode === 'manual' && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'manual' }}
          accessibilityLabel="Вручную"
        >
          <Text style={styles.chipText}>Вручную</Text>
        </Pressable>
      </View>

      {mode === 'paste' ? (
        <>
          <TextInput
            value={paste}
            onChangeText={setPaste}
            placeholder={'Магазин: Самокат\nМолоко 1 л — 89\nХлеб 1 шт 45\nПакет 5\nИтого: 139'}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.paste]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Текст заказа"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="К проверке" onPress={goPreviewFromPaste} />
        </>
      ) : (
        <>
          {manualLines.map((line, i) => (
            <View key={i} style={styles.row}>
              <TextInput
                value={line.name}
                onChangeText={(t) =>
                  setManualLines((prev) => prev.map((l, j) => (j === i ? { ...l, name: t } : l)))
                }
                placeholder="Позиция"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.name]}
                accessibilityLabel={`Позиция ${i + 1}`}
              />
              <TextInput
                value={line.qty}
                onChangeText={(t) =>
                  setManualLines((prev) => prev.map((l, j) => (j === i ? { ...l, qty: t } : l)))
                }
                placeholder="шт"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.qty]}
                accessibilityLabel={`Количество ${i + 1}`}
              />
              <TextInput
                value={line.amountRub}
                onChangeText={(t) =>
                  setManualLines((prev) => prev.map((l, j) => (j === i ? { ...l, amountRub: t } : l)))
                }
                placeholder="₽"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.amount]}
                accessibilityLabel={`Сумма ${i + 1}`}
              />
            </View>
          ))}
          <Pressable
            onPress={() => setManualLines((prev) => [...prev, { name: '', amountRub: '', qty: '' }])}
            accessibilityRole="button"
            accessibilityLabel="Добавить строку"
          >
            <Text style={styles.add}>+ Строка</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="К проверке" onPress={goPreviewFromManual} />
        </>
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: touchMin,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.text, backgroundColor: colors.background },
  chipText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
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
  paste: { minHeight: 160, paddingVertical: space.md },
  name: { flex: 1 },
  qty: { width: 56 },
  amount: { width: 72 },
  half: { flex: 1 },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  add: { fontSize: type.body, fontWeight: '700', color: colors.accent },
  link: { fontSize: type.caption, fontWeight: '700', color: colors.accent },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  warn: { fontSize: type.caption, color: colors.textMuted },
  error: { color: colors.danger, fontSize: type.caption },
  back: { fontSize: type.body, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
});
