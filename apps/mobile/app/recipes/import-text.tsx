import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import { parseRecipeText } from '../../../../src/domain/parseRecipeText';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { parsedRecipeToFormInitial } from '@/src/features/recipes/parsedRecipeToFormInitial';
import { setRecipeImportDraft } from '@/src/features/recipes/recipeImportDraft';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { alertMessage } from '@/src/utils/confirmAction';

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
            <Text key={`${ing.displayName}-${i}`} style={styles.previewItem}>
              · {ing.displayName}
              {ing.rawGrams != null ? ` · ${ing.rawGrams} г` : ' · г —'}
              {ing.energyKcalPer100g != null
                ? ` · ${ing.energyKcalPer100g} ккал/100г`
                : ''}
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
            Строки «N ккал · Б/Ж/У» склеиваем с продуктом выше и пересчитываем на 100 г.
            Цифры не выдумываем — только то, что есть в тексте.
          </Text>
        </View>
      ) : (
        <Text style={styles.idleHint}>
          Подсказка: строки вида «куриная грудка — 200 г» распознаются лучше всего.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
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
  content: { padding: space.lg, gap: space.md, paddingBottom: 40 },
  steps: { gap: space.sm, marginBottom: space.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: type.micro, fontWeight: '800', color: colors.text },
  stepText: { flex: 1, fontSize: type.caption, color: colors.textSecondary },
  pasteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pasteBtnText: { fontWeight: '700', fontSize: type.caption, color: colors.text },
  input: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  preview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: space.md,
    gap: 4,
  },
  previewTitle: {
    fontSize: type.subtitle,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  previewLine: { fontSize: type.caption, color: colors.textSecondary },
  previewItem: { fontSize: type.caption, color: colors.text, marginLeft: 4 },
  warn: { fontSize: type.micro, color: colors.textMuted, marginTop: 4 },
  hint: { fontSize: type.micro, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  idleHint: { fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
  error: { color: colors.danger, fontSize: type.caption, fontWeight: '600' },
  cancel: {
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontWeight: '700', color: colors.textSecondary },
  pressed: { opacity: 0.85 },
});
