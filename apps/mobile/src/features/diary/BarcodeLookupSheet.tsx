import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FoodProduct } from '../../../../../src/storage/types';
import { fetchOpenFoodFacts } from '../../integrations/fetchOpenFoodFacts';
import { FormScrollView } from '../../components/FormScrollView';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAddGuard } from '../../hooks/useAddGuard';
import { useData } from '../../state/DataContext';
import { colors, radius, space, touchMin, type } from '../../theme/tokens';
import { BarcodeCameraPanel, type ScanStatus } from './BarcodeCameraPanel';
import { ConfirmPortionSheet } from './ConfirmPortionSheet';
import { LabelCaptureSheet, type LabelDraft } from './LabelCaptureSheet';

type Phase = 'scan' | 'fallback' | 'label' | 'manual';
type FallbackKind = 'not_found' | 'incomplete' | 'offline';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
} as const;

const FALLBACK_TITLE: Record<FallbackKind, string> = {
  not_found: 'Нет в каталоге',
  incomplete: 'Нужны данные с этикетки',
  offline: 'Каталог недоступен',
};

const DEFAULT_GRAMS = 100;
/** After a confirmed add, briefly ignore the same code so the camera can't double-fire. */
const RESCAN_UNLOCK_MS = 2000;

export function BarcodeLookupSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { repo, dateLocal, meal, refresh, showFlash, revision } = useData();
  const allowAdd = useAddGuard();
  void revision;
  const insets = useSafeAreaInsets();
  const frequentLocal = repo.listFrequentProducts(12);
  const [phase, setPhase] = useState<Phase>('scan');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [fallbackKind, setFallbackKind] = useState<FallbackKind>('not_found');
  const [fallbackReason, setFallbackReason] = useState<string>('');
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [confirmGrams, setConfirmGrams] = useState(DEFAULT_GRAMS);
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const lockedCodeRef = useRef<string | null>(null);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumps on each lookup so late responses / watchdog don't stomp newer scans. */
  const lookupGenRef = useRef(0);

  const reset = () => {
    setPhase('scan');
    setCode('');
    setBusy(false);
    setMessage(null);
    setSourceNote(null);
    setFallbackKind('not_found');
    setFallbackReason('');
    setProduct(null);
    setConfirm(false);
    setConfirmGrams(DEFAULT_GRAMS);
    setManualName('');
    setManualKcal('');
    setManualProtein('');
    setManualFat('');
    setManualCarbs('');
    setManualError(null);
    lockedCodeRef.current = null;
    lookupGenRef.current += 1;
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
  };

  const closeAll = () => {
    reset();
    onClose();
  };

  const openFallback = (kind: FallbackKind, reason: string) => {
    lockedCodeRef.current = null;
    setFallbackKind(kind);
    setFallbackReason(reason);
    setPhase('fallback');
  };

  const scheduleRescanUnlock = (codeJustUsed: string) => {
    lockedCodeRef.current = codeJustUsed;
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(() => {
      if (lockedCodeRef.current === codeJustUsed) lockedCodeRef.current = null;
    }, RESCAN_UNLOCK_MS);
  };

  /**
   * Found a product — do NOT write diary yet.
   * Open portion sheet; keep barcode locked until confirm or cancel.
   */
  const offerProductForPortion = (p: FoodProduct, sourceLabel: string) => {
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
    lockedCodeRef.current = p.barcode ?? (code || '__portion__');
    setPhase('scan');
    setBusy(false);
    setProduct(p);
    setSourceNote(sourceLabel);
    setConfirmGrams(repo.lastGramsForProduct(p.id) ?? DEFAULT_GRAMS);
    setMessage(
      `Найдено: ${p.name}\n${sourceLabel}\nПока не в дневнике — укажи, сколько съел с этой упаковки.`,
    );
    setConfirm(true);
  };

  const lookupCode = useCallback(
    async (raw: string) => {
      setMessage(null);
      const cleaned = raw.replace(/\D/g, '');
      setCode(cleaned);
      if (!/^\d{8,14}$/.test(cleaned)) {
        setMessage('Штрихкод: 8–14 цифр');
        return;
      }
      // Block while looking up OR while portion sheet is open (avoids double-add).
      if (busy || confirm) return;
      if (lockedCodeRef.current === cleaned) return;
      lockedCodeRef.current = cleaned;

      const local = repo.findProductByBarcode(cleaned);
      if (local) {
        offerProductForPortion(local, 'Локальный индекс / кэш');
        return;
      }

      const gen = ++lookupGenRef.current;
      setBusy(true);
      const openOfflineFallback = (detail?: string) => {
        // Re-check local in case another path cached the code.
        const again = repo.findProductByBarcode(cleaned);
        if (again) {
          offerProductForPortion(again, 'Локальный индекс / кэш');
          return;
        }
        lockedCodeRef.current = null;
        openFallback(
          'offline',
          `Open Food Facts недоступен${detail ? `: ${detail}` : '.'} Выбери частый продукт из дневника (код привяжется) или добавь по этикетке — всё офлайн.`,
        );
      };
      // UI hard cap — never leave the spinner up if networking misbehaves.
      const watchdog = setTimeout(() => {
        if (lookupGenRef.current !== gen) return;
        lockedCodeRef.current = null;
        setBusy(false);
        openOfflineFallback('timeout');
      }, 20000);
      try {
        const result = await fetchOpenFoodFacts(cleaned);
        if (lookupGenRef.current !== gen) return;
        if (result.status === 'not_found') {
          lockedCodeRef.current = null;
          openFallback(
            'not_found',
            `Кода ${cleaned} нет в Open Food Facts. Возьми из частых локальных или этикетку/вручную — штрихкод сохранится.`,
          );
          return;
        }
        if (result.status === 'incomplete') {
          lockedCodeRef.current = null;
          openFallback(
            'incomplete',
            `${result.reason}. Дополни с этикетки или вручную — неизвестные поля останутся пустыми, не нулями.`,
          );
          return;
        }
        if (result.status !== 'ok') {
          openOfflineFallback('непонятный ответ');
          return;
        }

        const saved = repo.upsertFromOffResult(result);
        refresh();

        const hasAnyMacro =
          result.energyKcal !== null ||
          result.proteinG !== null ||
          result.fatG !== null ||
          result.carbG !== null;

        // unknown ≠ 0: still offer portion sheet; user can fill macros there
        const source = hasAnyMacro
          ? result.attribution
          : `${result.attribution} · КБЖУ неизвестны — можно дописать в порции`;
        offerProductForPortion(saved, source);
      } catch (e) {
        if (lookupGenRef.current !== gen) return;
        const detail = e instanceof Error ? e.message : '';
        openOfflineFallback(detail || undefined);
      } finally {
        clearTimeout(watchdog);
        if (lookupGenRef.current === gen) setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offerProduct uses meal/date via confirm handler
    [repo, refresh, busy, confirm, code],
  );

  const saveDraftProduct = (draft: LabelDraft) => {
    const saved = repo.createProduct({
      name: draft.name,
      barcode: draft.barcode,
      energyKcal: draft.energyKcal,
      proteinG: draft.proteinG,
      fatG: draft.fatG,
      carbG: draft.carbG,
      source: draft.source,
    });
    refresh();
    setPhase('scan');
    offerProductForPortion(saved, 'С этикетки / вручную');
  };

  const saveManual = () => {
    try {
      setManualError(null);
      const trimmed = manualName.trim();
      if (!trimmed) throw new Error('Укажи название');
      const parseOpt = (raw: string): number | null => {
        const t = raw.trim();
        if (t === '') return null;
        const n = Number(t.replace(',', '.'));
        if (!Number.isFinite(n) || n < 0) throw new Error('Числа КБЖУ ≥ 0');
        return n;
      };
      saveDraftProduct({
        name: trimmed,
        barcode: code || null,
        energyKcal: parseOpt(manualKcal),
        proteinG: parseOpt(manualProtein),
        fatG: parseOpt(manualFat),
        carbG: parseOpt(manualCarbs),
        source: 'user',
      });
    } catch (e) {
      setManualError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <>
      <Modal
        visible={visible && !confirm && phase !== 'label'}
        animationType="slide"
        accessibilityViewIsModal
        statusBarTranslucent
      >
        <View
          style={[
            styles.sheet,
            {
              paddingTop: Math.max(insets.top, 48),
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {phase === 'fallback'
                ? FALLBACK_TITLE[fallbackKind]
                : phase === 'manual'
                  ? 'Вручную'
                  : 'Сканер'}
            </Text>
            <Pressable onPress={closeAll} accessibilityRole="button" accessibilityLabel="Закрыть">
              <Text style={styles.close}>Закрыть</Text>
            </Pressable>
          </View>

          {phase === 'scan' ? (
            <FormScrollView contentContainerStyle={styles.scanBody}>
              <BarcodeCameraPanel
                enabled={visible && !busy && !confirm}
                status={
                  (busy
                    ? 'looking_up'
                    : message
                      ? 'captured'
                      : 'scanning') satisfies ScanStatus
                }
                lastCode={code || null}
                onScanned={(c) => void lookupCode(c)}
              />
              <Text style={styles.hint}>
                Скан только находит продукт. В дневник попадёт после того, как укажешь граммы —
                сколько реально съел, а не вся упаковка. Пока порция не подтверждена, повторный скан
                того же кода не добавляет ничего.
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="или введи код цифрами"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Штрихкод"
              />
              {message ? (
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  {message}
                </Text>
              ) : null}
              {busy ? (
                <ActivityIndicator color={colors.text} style={{ marginVertical: space.lg }} />
              ) : (
                <View style={styles.actions}>
                  <PrimaryButton label="Найти" onPress={() => void lookupCode(code)} />
                </View>
              )}
              <Text style={styles.attr}>
                Данные © Open Food Facts contributors · ru.openfoodfacts.org · ODbL. Фото этикетки в
                облако не уходят.
              </Text>
            </FormScrollView>
          ) : null}

          {phase === 'fallback' ? (
            <FormScrollView contentContainerStyle={styles.fallback} accessibilityLiveRegion="polite">
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Считанный штрихкод</Text>
                <Text style={styles.codeValue} selectable>
                  {code || '—'}
                </Text>
              </View>
              <Text style={styles.hint}>{fallbackReason}</Text>
              {frequentLocal.length > 0 ? (
                <View style={styles.localBlock}>
                  <Text style={styles.localTitle}>Частые из твоего дневника</Text>
                  <Text style={styles.localSub}>
                    Офлайн: тап привяжет штрихкод (если ещё нет) и откроет порцию — в дневник только
                    после подтверждения граммов.
                  </Text>
                  {frequentLocal.map((p) => (
                    <Pressable
                      key={p.id}
                      style={styles.localRow}
                      onPress={() => {
                        try {
                          const linked = repo.linkBarcodeToProduct(p.id, code);
                          refresh();
                          setPhase('scan');
                          offerProductForPortion(linked, 'Локальный индекс');
                        } catch (err) {
                          showFlash(err instanceof Error ? err.message : 'Не добавлено');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Выбрать ${p.name} из локального индекса`}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.localName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.localMeta}>
                          {p.energyKcal === null
                            ? '— ккал/100г'
                            : `${Math.round(p.energyKcal)} ккал/100г`}
                          {p.barcode ? ` · ${p.barcode}` : ' · без кода'}
                        </Text>
                      </View>
                      <Text style={styles.localPlus}>+</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.hint}>
                  Локальный индекс пуст — после нескольких логов частые продукты появятся здесь при
                  сбое сети.
                </Text>
              )}
              <PrimaryButton label="Снять этикетку и разобрать КБЖУ" onPress={() => setPhase('label')} />
              <Pressable
                style={styles.secondary}
                onPress={() => setPhase('manual')}
                accessibilityRole="button"
                accessibilityLabel="Ввести вручную"
              >
                <Text style={styles.secondaryText}>Ввести название и КБЖУ вручную</Text>
              </Pressable>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  lockedCodeRef.current = null;
                  setPhase('scan');
                  void lookupCode(code);
                }}
                accessibilityRole="button"
                accessibilityLabel="Повторить поиск в каталоге"
              >
                <Text style={styles.link}>Искать в каталоге ещё раз</Text>
              </Pressable>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  lockedCodeRef.current = null;
                  setPhase('scan');
                  setMessage(null);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Другой штрихкод</Text>
              </Pressable>
            </FormScrollView>
          ) : null}

          {phase === 'manual' ? (
            <FormScrollView contentContainerStyle={styles.manualBody}>
              <Text style={styles.hint}>
                Пустое поле = неизвестно (не подставляем 0). Код {code || '—'} сохранится с продуктом.
              </Text>
              <TextInput
                value={manualName}
                onChangeText={setManualName}
                placeholder="Название"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Название"
              />
              <Text style={styles.sectionLabel}>На 100 г</Text>
              <View style={styles.row}>
                <TextInput
                  value={manualProtein}
                  onChangeText={setManualProtein}
                  keyboardType="decimal-pad"
                  placeholder="Б"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.third]}
                  accessibilityLabel="Белки"
                />
                <TextInput
                  value={manualFat}
                  onChangeText={setManualFat}
                  keyboardType="decimal-pad"
                  placeholder="Ж"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.third]}
                  accessibilityLabel="Жиры"
                />
                <TextInput
                  value={manualCarbs}
                  onChangeText={setManualCarbs}
                  keyboardType="decimal-pad"
                  placeholder="У"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.third]}
                  accessibilityLabel="Углеводы"
                />
              </View>
              <TextInput
                value={manualKcal}
                onChangeText={setManualKcal}
                keyboardType="decimal-pad"
                placeholder="ккал / 100г"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                accessibilityLabel="Ккал"
              />
              {manualError ? <Text style={styles.error}>{manualError}</Text> : null}
              <PrimaryButton label="Сохранить → указать порцию" onPress={saveManual} />
              <Pressable style={styles.linkBtn} onPress={() => setPhase('fallback')}>
                <Text style={styles.link}>Назад</Text>
              </Pressable>
            </FormScrollView>
          ) : null}
        </View>
      </Modal>

      <LabelCaptureSheet
        visible={visible && phase === 'label'}
        barcode={code || null}
        onClose={() => setPhase('fallback')}
        onSave={saveDraftProduct}
      />

      <ConfirmPortionSheet
        visible={confirm && product != null}
        target={product ? { kind: 'product', product } : null}
        meal={meal}
        mealLabel={MEAL_LABELS[meal]}
        initialGrams={confirmGrams}
        onClose={() => {
          setConfirm(false);
          lockedCodeRef.current = null;
          setMessage(
            product
              ? `«${product.name}» не добавлен — порцию отменили. Можно сканировать снова.`
              : 'Порцию отменили. Можно сканировать снова.',
          );
        }}
        onConfirm={(result) => {
          if (!product) return;
          if (!allowAdd()) return;
          repo.updateProductNutrition(product.id, result.per100g);
          repo.addEntryFromProduct({
            productId: product.id,
            dateLocal,
            meal,
            grams: result.grams,
          });
          refresh();
          const kcal =
            result.per100g.energyKcal === null
              ? '—'
              : String(Math.round((result.per100g.energyKcal * result.grams) / 100));
          const line = `В дневнике: ${product.name} · ${result.grams} г · ~${kcal} ккал → ${MEAL_LABELS[meal].toLowerCase()}`;
          showFlash(line);
          setConfirm(false);
          setMessage(
            `${line}${sourceNote ? `\n${sourceNote}` : ''}\nМожно сканировать следующий продукт.`,
          );
          scheduleRescanUnlock(product.barcode ?? code);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
  },
  scanBody: { paddingBottom: space.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  close: { fontSize: type.body, fontWeight: '600', color: colors.text, minHeight: touchMin },
  hint: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: space.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
    marginBottom: space.md,
  },
  message: {
    color: colors.text,
    marginBottom: space.md,
    fontSize: type.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  actions: { gap: space.sm },
  attr: {
    marginTop: space.xl,
    fontSize: type.micro,
    color: colors.textMuted,
    lineHeight: 16,
  },
  fallback: { gap: space.sm, paddingBottom: 48 },
  localBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    gap: space.sm,
  },
  localTitle: { fontWeight: '800', fontSize: type.body, color: colors.text },
  localSub: { fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchMin,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  localName: { fontWeight: '700', color: colors.text, fontSize: type.body },
  localMeta: { fontSize: type.caption, color: colors.textMuted, marginTop: 2 },
  localPlus: { fontSize: 22, fontWeight: '800', color: colors.text, paddingLeft: space.sm },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.text,
    padding: space.lg,
    marginBottom: space.md,
  },
  codeLabel: {
    fontSize: type.caption,
    color: colors.textMuted,
    marginBottom: space.xs,
    fontWeight: '600',
  },
  codeValue: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  secondary: {
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  secondaryText: { fontWeight: '600', color: colors.text, fontSize: type.body },
  linkBtn: { minHeight: touchMin, justifyContent: 'center', marginTop: space.sm },
  link: { fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1 },
  error: { color: colors.danger, marginBottom: space.sm },
  manualBody: { paddingBottom: space.xl, gap: 0 },
  sectionLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: space.sm,
  },
});
