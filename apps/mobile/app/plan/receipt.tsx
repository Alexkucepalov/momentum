import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { parsePurchasePaste, type ParsedPurchaseLineDraft } from '../../../../src/domain/parsePurchasePaste';
import { FormScrollView } from '@/src/components/FormScrollView';
import {
  pickPurchaseScreenshotFromLibrary,
  takePurchaseScreenshot,
} from '@/src/media/purchaseScreenshot';
import { usePurchaseScreenshotOcr } from '@/src/ocr/usePurchaseScreenshotOcr';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { AppButton } from '@/src/design-system';

type Step = 'input' | 'preview';
type InputMode = 'paste' | 'manual' | 'screenshot';

type PreviewLine = ParsedPurchaseLineDraft & { key: string };

function toPreviewLines(lines: ParsedPurchaseLineDraft[]): PreviewLine[] {
  return lines.map((l, i) => ({ ...l, key: `l-${i}-${l.displayName}` }));
}

/**
 * Purchase import: paste / manual / on-device screenshot OCR → preview → confirm.
 * Unconfirmed draft never writes pantry. OCR stays on device (no cloud).
 */
export default function PurchaseImportScreen() {
  const router = useRouter();
  const { repo, dateLocal, refresh, showFlash } = useData();
  const [step, setStep] = useState<Step>('input');
  const [mode, setMode] = useState<InputMode>('paste');
  const [paste, setPaste] = useState('');
  const [manualLines, setManualLines] = useState([{ name: '', amountRub: '', qty: '' }]);
  const [storeLabel, setStoreLabel] = useState('');
  const [totalRub, setTotalRub] = useState('');
  const [lines, setLines] = useState<PreviewLine[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<'delivered' | 'fiscal_receipt'>('delivered');
  const [ocrBusy, setOcrBusy] = useState(false);

  const ocr = usePurchaseScreenshotOcr(mode === 'screenshot');

  const applyParsedPreview = (
    parsed: ReturnType<typeof parsePurchasePaste>,
    extraWarnings: string[] = [],
  ) => {
    if (parsed.lines.length === 0) {
      setError(parsed.warnings[0] ?? 'Нет позиций');
      return;
    }
    setStoreLabel(parsed.storeLabel ?? '');
    setTotalRub(parsed.totalRub != null ? String(parsed.totalRub) : '');
    setLines(toPreviewLines(parsed.lines));
    setWarnings([...extraWarnings, ...parsed.warnings]);
    setParseConfidence(parsed.parseConfidence);
    setStep('preview');
  };

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
    applyParsedPreview(parsePurchasePaste(paste));
  };

  const runScreenshotOcr = async (source: 'library' | 'camera') => {
    setError(null);
    setOcrBusy(true);
    try {
      const uri =
        source === 'library'
          ? await pickPurchaseScreenshotFromLibrary()
          : await takePurchaseScreenshot();
      if (!uri) return;
      const ocrResult = await ocr.recognizeUri(uri);
      setPaste(ocrResult.text);
      applyParsedPreview(parsePurchasePaste(ocrResult.text), [
        'OCR на устройстве — проверь строки (Самокат/METRO часто шумят).',
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось разобрать скрин');
    } finally {
      setOcrBusy(false);
    }
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
      const sourceKind =
        mode === 'screenshot' ? 'screenshots' : mode === 'paste' ? 'paste' : 'manual';
      const result = repo.confirmNewPurchase({
        status: confirmStatus,
        sourceKind,
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
      showFlash(`Покупка добавлена: ${pantryN} в запасы · ${exp}`);
      router.replace('/plan/pantry');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  if (step === 'preview') {
    const pantryCount = lines.filter((l) => !l.excluded && l.isFood).length;
    return (
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>Проверь позиции. Черновик ещё не в запасах.</Text>

        <Text style={styles.fieldLabel}>Магазин</Text>
        <TextInput
          value={storeLabel}
          onChangeText={setStoreLabel}
          placeholder="Необязательно"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          accessibilityLabel="Магазин"
        />
        <Text style={styles.fieldLabel}>Итого чека, ₽</Text>
        <TextInput
          value={totalRub}
          onChangeText={setTotalRub}
          placeholder="Пусто = сумма известных строк"
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

        {lines.map((line, i) => {
          const unitLabel =
            line.unit === 'g' ? 'г' : line.unit === 'ml' ? 'мл' : line.unit === 'pcs' ? 'шт' : 'ед.';
          return (
            <View key={line.key} style={styles.card}>
              <Text style={styles.fieldLabel}>Название</Text>
              <TextInput
                value={line.displayName}
                onChangeText={(t) =>
                  setLines((prev) => prev.map((l, j) => (j === i ? { ...l, displayName: t } : l)))
                }
                style={styles.input}
                accessibilityLabel={`Название позиции ${i + 1}`}
              />
              <View style={styles.fieldsStack}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    Количество{line.unit ? ` (${unitLabel})` : ''}
                  </Text>
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
                    placeholder="пусто = неизвестно"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    accessibilityLabel={`Количество ${i + 1}${line.unit ? ` ${unitLabel}` : ''}`}
                  />
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Сумма, ₽</Text>
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
                                lineTotalRub:
                                  v && (n == null || !Number.isFinite(n)) ? l.lineTotalRub : n,
                              }
                            : l,
                        ),
                      );
                    }}
                    placeholder="пусто = неизвестно"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    accessibilityLabel={`Сумма ${i + 1}`}
                  />
                </View>
              </View>
              {line.packageSizeText ? (
                <Text style={styles.meta}>Упаковка: {line.packageSizeText}</Text>
              ) : null}
              <View style={styles.rowWrap}>
                <Pressable
                  onPress={() =>
                    setLines((prev) =>
                      prev.map((l, j) => (j === i ? { ...l, excluded: !l.excluded } : l)),
                    )
                  }
                  style={styles.actionChip}
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
                  style={styles.actionChip}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: line.isFood }}
                  accessibilityLabel={`Еда позиция ${i + 1}`}
                >
                  <Text style={styles.link}>{line.isFood ? 'Еда → запасы' : 'Не еда'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {warnings.map((w) => (
          <Text key={w} style={styles.warn}>
            {w}
          </Text>
        ))}

        <Text style={styles.summary} accessibilityRole="summary">
          Расход:{' '}
          {knownExpense == null ? 'неизвестен' : `${Math.round(knownExpense)} ₽`}
          {' · '}В запасы: {pantryCount}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label="Подтвердить покупку" onPress={confirm} />
        <Pressable
          onPress={() => setStep('input')}
          accessibilityRole="button"
          accessibilityLabel="Назад к вводу"
        >
          <Text style={styles.back}>← Изменить ввод</Text>
        </Pressable>
      </FormScrollView>
    );
  }

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Текст заказа, скрин корзины Самокат/METRO (OCR на устройстве) или ручной ввод. Без
        подтверждения запасы не меняются.
      </Text>

      <View style={styles.statusRow}>
        <Pressable
          onPress={() => setMode('paste')}
          style={[styles.chip, mode === 'paste' && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'paste' }}
          accessibilityLabel="Вставить текст"
        >
          <Text style={styles.chipText}>Текст</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('screenshot')}
          style={[styles.chip, mode === 'screenshot' && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'screenshot' }}
          accessibilityLabel="Скрин заказа"
        >
          <Text style={styles.chipText}>Скрин</Text>
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
          <AppButton label="К проверке" onPress={goPreviewFromPaste} />
        </>
      ) : mode === 'screenshot' ? (
        <>
          <Text style={styles.hint}>
            Скрин заказа или корзины. Текст распознаётся на телефоне (кириллица). Качество плавает —
            на preview поправь строки. Фото никуда не уходит.
          </Text>
          {ocr.downloadProgress > 0 && ocr.downloadProgress < 1 ? (
            <Text style={styles.meta} accessibilityLiveRegion="polite">
              Загрузка модели OCR… {Math.round(ocr.downloadProgress * 100)}%
            </Text>
          ) : null}
          {ocr.modelError ? (
            <Text style={styles.warn}>
              Модель OCR: {ocr.modelError.message}. Можно вставить текст вкладкой «Текст».
            </Text>
          ) : null}
          {ocrBusy || ocr.isGenerating ? (
            <View style={styles.ocrBusy} accessibilityLabel="Распознавание">
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.meta}>Распознаю скрин…</Text>
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton
            label="Выбрать скрин из галереи"
            onPress={() => void runScreenshotOcr('library')}
            disabled={ocrBusy || ocr.isGenerating}
          />
          <AppButton
            label="Снять камерой"
            onPress={() => void runScreenshotOcr('camera')}
            disabled={ocrBusy || ocr.isGenerating}
          />
          <Pressable
            onPress={() => setMode('paste')}
            accessibilityRole="button"
            accessibilityLabel="Перейти к вставке текста"
          >
            <Text style={styles.back}>Не разобрал → вставить текст</Text>
          </Pressable>
        </>
      ) : (
        <>
          {manualLines.map((line, i) => (
            <View key={i} style={styles.manualCard}>
              <Text style={styles.fieldLabel}>Позиция</Text>
              <TextInput
                value={line.name}
                onChangeText={(t) =>
                  setManualLines((prev) => prev.map((l, j) => (j === i ? { ...l, name: t } : l)))
                }
                placeholder="Название"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel={`Позиция ${i + 1}`}
              />
              <View style={styles.fieldsStack}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Количество</Text>
                  <TextInput
                    value={line.qty}
                    onChangeText={(t) =>
                      setManualLines((prev) => prev.map((l, j) => (j === i ? { ...l, qty: t } : l)))
                    }
                    placeholder="шт / г / мл"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    accessibilityLabel={`Количество ${i + 1}`}
                  />
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Сумма, ₽</Text>
                  <TextInput
                    value={line.amountRub}
                    onChangeText={(t) =>
                      setManualLines((prev) =>
                        prev.map((l, j) => (j === i ? { ...l, amountRub: t } : l)),
                      )
                    }
                    placeholder="пусто = неизвестно"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    accessibilityLabel={`Сумма ${i + 1}`}
                  />
                </View>
              </View>
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
          <AppButton label="К проверке" onPress={goPreviewFromManual} />
        </>
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
    maxWidth: '100%',
  },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  fieldLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldsStack: { gap: space.sm, width: '100%' },
  fieldBlock: { width: '100%', minWidth: 0 },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
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
  actionChip: { minHeight: touchMin, justifyContent: 'center' },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
    alignSelf: 'stretch',
    width: '100%' as unknown as number,
    maxWidth: '100%' as unknown as number,
    minWidth: 0,
    // RN Web: include padding/border in width so fields don't clip card edges.
    ...( { boxSizing: 'border-box' } as object ),
  },
  paste: { minHeight: 160, paddingVertical: space.md },
  name: { flex: 1, minWidth: 0 },
  qty: { width: 72, maxWidth: '40%', minWidth: 0, flexShrink: 1 },
  amount: { width: 88, maxWidth: '40%', minWidth: 0, flexShrink: 1 },
  half: { flex: 1, minWidth: 0, flexShrink: 1 },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  manualCard: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    width: '100%',
    maxWidth: '100%',
  },
  add: { fontSize: type.body, fontWeight: '700', color: colors.accent },
  link: { fontSize: type.caption, fontWeight: '700', color: colors.accent },
  hint: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 20 },
  meta: { fontSize: type.caption, color: colors.textSecondary },
  ocrBusy: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  summary: { fontSize: type.body, fontWeight: '600', color: colors.text },
  warn: { fontSize: type.caption, color: colors.textMuted },
  error: { color: colors.danger, fontSize: type.caption },
  back: { fontSize: type.body, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
});
