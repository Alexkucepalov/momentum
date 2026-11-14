import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { ThemedText as Text } from '@/src/design-system/components/ThemedText';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import {
  parseRecipeText,
  type ParsedRecipeIngredient,
} from '../../../../src/domain/parseRecipeText';
import { FormScrollView } from '@/src/components/FormScrollView';
import { parsedRecipeToFormInitial } from '@/src/features/recipes/parsedRecipeToFormInitial';
import { setRecipeImportDraft } from '@/src/features/recipes/recipeImportDraft';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { alertMessage } from '@/src/utils/confirmAction';
import { AppButton } from '@/src/design-system';

/** Per-100g macros from parser only — never invent. */
function formatPer100g(ing: ParsedRecipeIngredient): string {
  const parts: string[] = [];
  if (ing.energyKcalPer100g != null) parts.push(`${ing.energyKcalPer100g} ккал`);
  if (ing.proteinGPer100g != null) parts.push(`Б ${ing.proteinGPer100g}`);
  if (ing.fatGPer100g != null) parts.push(`Ж ${ing.fatGPer100g}`);
  if (ing.carbGPer100g != null) parts.push(`У ${ing.carbGPer100g}`);
  if (parts.length === 0) return '';
  return ` · ${parts.join(' · ')}/100г`;
}

export default function ImportRecipeTextScreen() {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const t = raw.trim();
    if (!t) return null;
    return parseRecipeText(t);
  }, [raw]);

  const pasteFromClipboard = async () => {
    try {
      const t = (await Clipboard.getStringAsync()).trim();
      if (!t) {
        alertMessage('Буфер пуст', 'Скопируй текст рецепта и нажми снова.');
        return;
      }
      setRaw(t);
      setError(null);
    } catch {
      alertMessage('Буфер', 'Не удалось прочитать — вставь текст вручную.');
    }
  };

  const openEditor = () => {
    const t = raw.trim();
    if (!t) {
      setError('Вставь текст рецепта');
      return;
    }
    const parsed = parseRecipeText(t);
    if (!parsed.name && parsed.ingredients.length === 0) {
      setError('Не удалось разобрать — нужны название или строки с граммами (например «200 г курицы»)');
      return;
    }
    setError(null);
    setRecipeImportDraft(parsedRecipeToFormInitial(parsed));
    router.replace('/recipes/new');
  };

  const canOpen =
    !!raw.trim() &&
    !!(preview && (preview.name || preview.ingredients.length > 0));

  return (
    <FormScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.steps}>
        <Step n={1} text="Вставь текст из чата или заметки" />
        <Step n={2} text="Проверь предпросмотр" />
        <Step n={3} text="Открой редактор и сохрани" />
      </View>

      <View style={styles.pasteRow}>
        <Pressable
          onPress={() => void pasteFromClipboard()}
          style={({ pressed }) => [styles.pasteBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Вставить из буфера"
        >
          <Ionicons name="clipboard-outline" size={18} color={colors.text} />
          <Text style={styles.pasteBtnText}>Из буфера</Text>
        </Pressable>
        {raw.length > 0 ? (
          <Pressable
            onPress={() => {
              setRaw('');
              setError(null);
            }}
            style={({ pressed }) => [styles.pasteBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Очистить текст"
          >
            <Text style={styles.pasteBtnText}>Очистить</Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        value={raw}
        onChangeText={(t) => {
          setRaw(t);
          setError(null);
        }}
        multiline
        autoCapitalize="sentences"
        autoCorrect
        placeholder={`Пример:\nОвсянка с ягодами\nВыход: 350 г\n\nИнгредиенты:\n- овсянка 60 г\n- молоко 200 г\n\nПриготовление:\n…`}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        textAlignVertical="top"
        accessibilityLabel="Текст рецепта"
      />

      {preview && raw.trim() ? (
        <View style={styles.preview} accessibilityLabel="Предпросмотр разбора">
          <Text style={styles.previewTitle}>Что распознали</Text>
          <Text style={styles.previewLine}>Название: {preview.name ?? '—'}</Text>
          <Text style={styles.previewLine}>
            Выход: {preview.cookedYieldG != null ? `${preview.cookedYieldG} г` : '—'}
          </Text>
          <Text style={styles.previewLine}>Ингредиентов: {preview.ingredients.length}</Text>
          {preview.ingredients.slice(0, 8).map((ing, i) => (
            <Text
              key={`${ing.displayName}-${i}`}
              style={styles.previewItem}
              accessibilityLabel={`${ing.displayName}${
                ing.rawGrams != null ? `, ${ing.rawGrams} грамм` : ''
              }${formatPer100g(ing)}`}
            >
              · {ing.displayName}
              {ing.rawGrams != null ? ` · ${ing.rawGrams} г` : ' · г —'}
              {formatPer100g(ing)}
            </Text>
          ))}
          {preview.ingredients.length > 8 ? (
            <Text style={styles.previewItem}>… ещё {preview.ingredients.length - 8}</Text>
          ) : null}
          {preview.warnings.map((w) => (
            <Text key={w} style={styles.warn}>
              {w}
            </Text>
          ))}
          <Text style={styles.hint}>
            Пустые Б/Ж/У — неизвестны, не ноль. В редакторе поправь только сомнительные поля.
          </Text>
        </View>
      ) : (
        <Text style={styles.idleHint}>Вставь текст — ниже появится разбор без выдуманных цифр.</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        label="Открыть в редакторе"
        onPress={openEditor}
        disabled={!canOpen}
      />
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Назад к рецептам"
      >
        <Text style={styles.cancelText}>Назад</Text>
      </Pressable>
    </FormScrollView>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  steps: { 
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: type.caption, fontWeight: '800', color: colors.primaryButtonText },
  stepText: { flex: 1, fontSize: type.body, color: colors.text, lineHeight: 20 },
  pasteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchMin,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,





  },
  pasteBtnText: { fontWeight: '700', fontSize: type.body, color: colors.text },
  input: {
    minHeight: 240,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: space.lg,
    fontSize: type.body,
    color: colors.text,
    lineHeight: 22,





  },
  preview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: 6,





  },
  previewTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  previewLine: { fontSize: type.body, color: colors.textSecondary, lineHeight: 20 },
  previewItem: { fontSize: type.body, color: colors.text, marginLeft: space.sm, lineHeight: 20 },
  warn: { fontSize: type.caption, color: colors.textMuted, marginTop: space.sm, lineHeight: 18 },
  hint: { fontSize: type.caption, color: colors.textSecondary, marginTop: space.md, lineHeight: 18 },
  idleHint: { 
    fontSize: type.body, 
    color: colors.textSecondary, 
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: space.lg,
  },
  error: { color: colors.danger, fontSize: type.body, fontWeight: '600', textAlign: 'center' },
  cancel: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontWeight: '700', fontSize: type.body, color: colors.textSecondary },
  pressed: { opacity: 0.75 },
});
