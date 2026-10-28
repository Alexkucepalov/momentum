import { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseNutritionLabelText } from '../../../../../src/domain/parseNutritionLabel';
import type { NutritionSource } from '../../../../../src/storage/types';
import { FormScrollView } from '../../components/FormScrollView';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, space, touchMin, type, surfaceCard } from '../../theme/tokens';

export type LabelDraft = {
  name: string;
  barcode: string | null;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbG: number | null;
  source: NutritionSource;
};

function numToField(n: number | null): string {
  return n === null ? '' : String(n);
}

function parseOptionalField(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error('Числа КБЖУ должны быть ≥ 0');
  return n;
}

export function LabelCaptureSheet({
  visible,
  barcode,
  initialName,
  onClose,
  onSave,
}: {
  visible: boolean;
  barcode: string | null;
  initialName?: string | null;
  onClose: () => void;
  onSave: (draft: LabelDraft) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [name, setName] = useState(initialName ?? '');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const resetFieldsFromParse = (text: string) => {
    const parsed = parseNutritionLabelText(text);
    if (parsed.name && !name.trim()) setName(parsed.name);
    if (parsed.energyKcal !== null) setKcal(numToField(parsed.energyKcal));
    if (parsed.proteinG !== null) setProtein(numToField(parsed.proteinG));
    if (parsed.fatG !== null) setFat(numToField(parsed.fatG));
    if (parsed.carbG !== null) setCarbs(numToField(parsed.carbG));
    if (parsed.foundFields.length === 0) {
      setHint('В тексте не нашлись КБЖУ — поправь поля вручную. Пустое поле = неизвестно, не 0.');
    } else {
      setHint(
        `Разобрано: ${parsed.foundFields.join(', ')}. Проверь перед сохранением — OCR ошибается.`,
      );
    }
  };

  const takePhoto = async () => {
    setError(null);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch {
      setError('Не удалось сделать снимок');
    }
  };

  const applyParse = () => {
    setError(null);
    if (!ocrText.trim()) {
      setError('Вставь текст с этикетки (или с диктовки/OCR системы), затем «Разобрать»');
      return;
    }
    resetFieldsFromParse(ocrText);
  };

  const save = () => {
    try {
      setError(null);
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Укажи название продукта');
      onSave({
        name: trimmed,
        barcode,
        energyKcal: parseOptionalField(kcal),
        proteinG: parseOptionalField(protein),
        fatG: parseOptionalField(fat),
        carbG: parseOptionalField(carbs),
        source: 'label',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не сохранено');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" accessibilityViewIsModal statusBarTranslucent>
      <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 48), paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Этикетка КБЖУ
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Text style={styles.close}>Закрыть</Text>
          </Pressable>
        </View>

        <FormScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>
            Сфотографируй блок «пищевая ценность / на 100 г». В Expo Go авто-OCR на устройстве нет —
            вставь текст этикетки (или продиктуй), мы разберём КБЖУ без выдуманных нулей. Фото
            остаётся только локально.
          </Text>

          {Platform.OS !== 'web' && permission?.granted && !photoUri ? (
            <View style={styles.camWrap}>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <PrimaryButton label="Сфотографировать" onPress={() => void takePhoto()} />
            </View>
          ) : null}

          {Platform.OS !== 'web' && permission && !permission.granted ? (
            <View style={styles.block}>
              <Text style={styles.hint}>Без камеры можно вставить текст этикетки вручную.</Text>
              <PrimaryButton label="Разрешить камеру" onPress={() => void requestPermission()} />
            </View>
          ) : null}

          {photoUri ? (
            <View style={styles.block}>
              <Image source={{ uri: photoUri }} style={styles.preview} accessibilityLabel="Фото этикетки" />
              <Pressable onPress={() => setPhotoUri(null)} accessibilityRole="button">
                <Text style={styles.link}>Переснять</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.label}>Название</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Название продукта"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Название продукта"
          />
          {barcode ? <Text style={styles.meta}>Штрихкод: {barcode}</Text> : null}

          <Text style={styles.label}>На 100 г</Text>
          <View style={styles.row}>
            <TextInput
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              style={[styles.input, styles.third]}
              placeholder="Б"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Белки"
            />
            <TextInput
              value={fat}
              onChangeText={setFat}
              keyboardType="decimal-pad"
              style={[styles.input, styles.third]}
              placeholder="Ж"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Жиры"
            />
            <TextInput
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              style={[styles.input, styles.third]}
              placeholder="У"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Углеводы"
            />
          </View>
          <TextInput
            value={kcal}
            onChangeText={setKcal}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="ккал (пусто = неизвестно)"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Ккал на 100 г"
          />

          <Text style={styles.label}>Текст с этикетки (опционально)</Text>
          <TextInput
            value={ocrText}
            onChangeText={setOcrText}
            multiline
            placeholder="Энергетическая ценность 250 ккал&#10;Белки 10 г&#10;Жиры 5 г&#10;Углеводы 30 г"
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
            accessibilityLabel="Текст этикетки для разбора КБЖУ"
          />
          <PrimaryButton label="Разобрать КБЖУ из текста" onPress={applyParse} />

          {hint ? (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {hint}
            </Text>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Сохранить продукт" onPress={save} />
        </FormScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  close: { fontSize: type.body, fontWeight: '600', color: colors.text, minHeight: touchMin },
  content: { paddingHorizontal: space.lg },
  hint: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: space.lg,
  },
  camWrap: { marginBottom: space.lg, gap: space.sm },
  camera: { height: 200, borderRadius: radius.lg, overflow: 'hidden' },
  block: { marginBottom: space.lg, gap: space.sm },
  preview: { width: '100%', height: 160, borderRadius: radius.md },
  link: { fontWeight: '600', color: colors.text, minHeight: touchMin },
  label: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: space.sm,
    marginTop: space.sm,
  },
  input: {
    ...surfaceCard,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
    marginBottom: space.md,
  },
  textArea: {
    ...surfaceCard,
    minHeight: 100,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: type.body,
    color: colors.text,
    marginBottom: space.md,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: space.sm },
  third: { flex: 1 },
  meta: { fontSize: type.caption, color: colors.textMuted, marginBottom: space.md },
  message: {
    color: colors.text,
    marginVertical: space.md,
    fontSize: type.caption,
    lineHeight: 18,
  },
  error: { color: colors.danger, marginBottom: space.sm },
});
