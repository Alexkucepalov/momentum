import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseExportJson, summarizeSnapshot } from '../../../../src/domain/importExport';
import {
  nutritionConsistencyHint,
  parseMacroField,
} from '../../../../src/domain/nutritionConsistency';
import { localDateKey } from '../../../../src/storage/validation';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { getDemo2WeeksExportJson } from '@/src/fixtures/demo2Weeks';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { alertMessage, confirmAction } from '@/src/utils/confirmAction';

const WATER_PRESETS = [1500, 2000, 2500, 3000] as const;

function profileToFields(profile: {
  waterTargetMl: number | null;
  heightCm: number | null;
  dailyEnergyKcal: number | null;
  dailyProteinG: number | null;
  dailyFatG: number | null;
  dailyCarbG: number | null;
}) {
  return {
    waterRaw: profile.waterTargetMl === null ? '' : String(profile.waterTargetMl),
    heightRaw: profile.heightCm === null ? '' : String(profile.heightCm),
    kcalRaw: profile.dailyEnergyKcal === null ? '' : String(profile.dailyEnergyKcal),
    proteinRaw: profile.dailyProteinG === null ? '' : String(profile.dailyProteinG),
    fatRaw: profile.dailyFatG === null ? '' : String(profile.dailyFatG),
    carbRaw: profile.dailyCarbG === null ? '' : String(profile.dailyCarbG),
  };
}

export default function ProfileScreen() {
  const { repo, refresh, revision, showFlash, setDateLocal } = useData();
  const insets = useSafeAreaInsets();
  const profile = repo.getProfile();
  const fields = profileToFields(profile);
  const [waterRaw, setWaterRaw] = useState(fields.waterRaw);
  const [heightRaw, setHeightRaw] = useState(fields.heightRaw);
  const [kcalRaw, setKcalRaw] = useState(fields.kcalRaw);
  const [proteinRaw, setProteinRaw] = useState(fields.proteinRaw);
  const [fatRaw, setFatRaw] = useState(fields.fatRaw);
  const [carbRaw, setCarbRaw] = useState(fields.carbRaw);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteRaw, setPasteRaw] = useState('');

  useEffect(() => {
    const next = profileToFields(repo.getProfile());
    setWaterRaw(next.waterRaw);
    setHeightRaw(next.heightRaw);
    setKcalRaw(next.kcalRaw);
    setProteinRaw(next.proteinRaw);
    setFatRaw(next.fatRaw);
    setCarbRaw(next.carbRaw);
  }, [repo, revision]);

  const summary = useMemo(() => {
    const chips: string[] = [];
    if (profile.dailyEnergyKcal != null) chips.push(`${Math.round(profile.dailyEnergyKcal)} ккал`);
    if (profile.dailyProteinG != null) chips.push(`Б ${Math.round(profile.dailyProteinG)}`);
    if (profile.dailyFatG != null) chips.push(`Ж ${Math.round(profile.dailyFatG)}`);
    if (profile.dailyCarbG != null) chips.push(`У ${Math.round(profile.dailyCarbG)}`);
    if (profile.heightCm != null) chips.push(`${profile.heightCm} см`);
    if (profile.waterTargetMl != null) chips.push(`${profile.waterTargetMl} мл воды`);
    return chips;
  }, [profile]);

  /** Soft note only — never auto-rewrite independent daily targets. */
  const targetsMacroHint = useMemo(() => {
    const hint = nutritionConsistencyHint({
      energyKcal: parseMacroField(kcalRaw),
      proteinG: parseMacroField(proteinRaw),
      fatG: parseMacroField(fatRaw),
      carbG: parseMacroField(carbRaw),
    });
    if (!hint) return null;
    return 'ккал и БЖУ заданы независимо — по формуле 4/9/4 они сейчас расходятся. Цели не меняем без тебя.';
  }, [kcalRaw, proteinRaw, fatRaw, carbRaw]);

  const parseOptionalPositive = (raw: string, label: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error(`${label}: число ≥ 0 или пусто`);
    return n;
  };

  /** Auto-save on blur / preset — no separate «Сохранить» buttons. */
  const commitWater = (raw: string = waterRaw) => {
    try {
      const t = raw.trim();
      let next: number | null;
      if (t === '') {
        next = null;
      } else {
        const n = Number(t.replace(',', '.'));
        if (!Number.isFinite(n) || n <= 0) {
          showFlash('Вода: положительное число или пусто');
          return;
        }
        next = n;
      }
      if (next === profile.waterTargetMl) return;
      repo.setWaterTargetMl(next);
      refresh();
      showFlash(next == null ? 'Цель воды снята' : `Сохранено: вода ${Math.round(next)} мл`);
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Вода не сохранена');
    }
  };

  const commitHeight = (raw: string = heightRaw) => {
    try {
      const cm = parseOptionalPositive(raw, 'Рост');
      if (cm !== null && cm <= 0) throw new Error('Рост должен быть > 0');
      if (cm === profile.heightCm) return;
      repo.setHeightCm(cm);
      refresh();
      showFlash(cm == null ? 'Рост очищен' : `Сохранено: рост ${cm} см`);
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'Рост не сохранён');
    }
  };

  const commitDailyTargets = (override?: {
    kcal?: string;
    protein?: string;
    fat?: string;
    carb?: string;
  }) => {
    try {
      const next = {
        energyKcal: parseOptionalPositive(override?.kcal ?? kcalRaw, 'ккал'),
        proteinG: parseOptionalPositive(override?.protein ?? proteinRaw, 'Белки'),
        fatG: parseOptionalPositive(override?.fat ?? fatRaw, 'Жиры'),
        carbG: parseOptionalPositive(override?.carb ?? carbRaw, 'Углеводы'),
      };
      const same =
        next.energyKcal === profile.dailyEnergyKcal &&
        next.proteinG === profile.dailyProteinG &&
        next.fatG === profile.dailyFatG &&
        next.carbG === profile.dailyCarbG;
      if (same) return;
      repo.setDailyNutritionTargets(next);
      refresh();
      const parts: string[] = [];
      if (next.energyKcal != null) parts.push(`${Math.round(next.energyKcal)} ккал`);
      if (next.proteinG != null) parts.push(`Б ${Math.round(next.proteinG)}`);
      if (next.fatG != null) parts.push(`Ж ${Math.round(next.fatG)}`);
      if (next.carbG != null) parts.push(`У ${Math.round(next.carbG)}`);
      showFlash(parts.length ? `Сохранено: ${parts.join(' · ')}` : 'Цели КБЖУ сняты');
    } catch (e) {
      showFlash(e instanceof Error ? e.message : 'КБЖУ не сохранены');
    }
  };

  const onExport = async () => {
    const json = repo.exportAll();
    try {
      await Clipboard.setStringAsync(json);
      showFlash('Экспорт скопирован в буфер');
    } catch {
      alertMessage('Экспорт', 'Не удалось скопировать. Попробуй ещё раз.');
    }
  };

  const applyImport = (json: string) => {
    const result = repo.importAll(json);
    const tz = repo.getProfile().timezone;
    setDateLocal(localDateKey(new Date(), tz));
    refresh();
    setPasteOpen(false);
    setPasteRaw('');
    showFlash(`Восстановлено · v${result.version} · ${result.entries} записей`);
  };

  const confirmAndImport = (json: string, sourceLabel: string) => {
    try {
      const parsed = parseExportJson(json);
      if (!parsed.ok) {
        alertMessage('Импорт', parsed.error);
        return;
      }
      const summary = summarizeSnapshot(parsed.snapshot);
      confirmAction(
        'Восстановить данные?',
        `${sourceLabel}\n\nВерсия ${summary.version} · продуктов ${summary.products} · рецептов ${summary.recipes} · записей ${summary.entries} · тренировок ${summary.workouts}.\n\nТекущие локальные данные будут заменены.`,
        {
          confirmLabel: 'Восстановить',
          destructive: true,
          onConfirm: () => {
            try {
              applyImport(json);
            } catch (e) {
              alertMessage('Импорт', e instanceof Error ? e.message : 'Не удалось');
            }
          },
        },
      );
    } catch (e) {
      alertMessage('Импорт', e instanceof Error ? e.message : 'Не удалось прочитать данные');
    }
  };

  const onImportClipboard = async () => {
    try {
      const json = (await Clipboard.getStringAsync()).trim();
      if (!json) {
        alertMessage(
          'Буфер пуст',
          'Буфер Mac и телефона — разные. На Mac в браузере нажми «Загрузить демо 2 недели» или «Вставить JSON».',
        );
        return;
      }
      confirmAndImport(json, 'Из буфера обмена');
    } catch {
      alertMessage(
        'Импорт',
        'Не удалось прочитать буфер — используй «Загрузить демо» / «Вставить JSON».',
      );
    }
  };

  const onImportDemo = () => {
    try {
      confirmAndImport(getDemo2WeeksExportJson(), 'Демо-фикстура (синтетика, 2 недели)');
    } catch (e) {
      alertMessage('Импорт', e instanceof Error ? e.message : 'Демо недоступно в этой сборке');
    }
  };

  const onImportPaste = () => {
    confirmAndImport(pasteRaw, 'Вставленный JSON');
  };

  const onDelete = () => {
    confirmAction(
      'Удалить все локальные данные?',
      'Продукты, дневник, вес и привычки на этом устройстве. Сначала сделай экспорт.',
      {
        confirmLabel: 'Удалить',
        destructive: true,
        onConfirm: () => {
          repo.deleteAllUserData();
          refresh();
          showFlash('Локальные данные очищены');
        },
      },
    );
  };

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.text} />
          </View>
          <Text style={styles.name} accessibilityRole="header">
            Профиль
          </Text>
          <Text style={styles.meta}>Только на устройстве · {profile.timezone}</Text>
          {summary.length > 0 ? (
            <View style={styles.summaryRow} accessibilityLabel={`Активные цели: ${summary.join(', ')}`}>
              {summary.map((chip) => (
                <View key={chip} style={styles.summaryChip}>
                  <Text style={styles.summaryText}>{chip}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmpty}>Цели пока не заданы — всё опционально</Text>
          )}
        </View>

        <SettingsCard
          title="КБЖУ на день"
          hint="Свои числа · пусто = без цели · ккал и БЖУ независимы"
          icon="flame-outline"
        >
          <LabeledField
            label="ккал"
            value={kcalRaw}
            onChangeText={setKcalRaw}
            onCommit={(t) => {
              setKcalRaw(t);
              commitDailyTargets({ kcal: t });
            }}
            keyboardType="decimal-pad"
            placeholder="например 2200"
            accessibilityLabel="Цель килокалорий на день"
          />
          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <LabeledField
                label="Белки, г"
                value={proteinRaw}
                onChangeText={setProteinRaw}
                onCommit={(t) => {
                  setProteinRaw(t);
                  commitDailyTargets({ protein: t });
                }}
                keyboardType="decimal-pad"
                placeholder="Б"
                accessibilityLabel="Цель белков в граммах"
              />
            </View>
            <View style={styles.macroCol}>
              <LabeledField
                label="Жиры, г"
                value={fatRaw}
                onChangeText={setFatRaw}
                onCommit={(t) => {
                  setFatRaw(t);
                  commitDailyTargets({ fat: t });
                }}
                keyboardType="decimal-pad"
                placeholder="Ж"
                accessibilityLabel="Цель жиров в граммах"
              />
            </View>
            <View style={styles.macroCol}>
              <LabeledField
                label="Углеводы, г"
                value={carbRaw}
                onChangeText={setCarbRaw}
                onCommit={(t) => {
                  setCarbRaw(t);
                  commitDailyTargets({ carb: t });
                }}
                keyboardType="decimal-pad"
                placeholder="У"
                accessibilityLabel="Цель углеводов в граммах"
              />
            </View>
          </View>
          {targetsMacroHint ? (
            <Text style={styles.targetsHint} accessibilityLiveRegion="polite">
              {targetsMacroHint}
            </Text>
          ) : null}
        </SettingsCard>

        <SettingsCard title="Рост" hint="Для ИМТ в Прогрессе" icon="resize-outline">
          <LabeledField
            label="Сантиметры"
            value={heightRaw}
            onChangeText={setHeightRaw}
            onCommit={(t) => {
              setHeightRaw(t);
              commitHeight(t);
            }}
            keyboardType="decimal-pad"
            placeholder="например 175"
            accessibilityLabel="Рост в сантиметрах"
          />
        </SettingsCard>

        <SettingsCard title="Вода" hint="Цель на Сегодня · пресет или своё число" icon="water-outline">
          <View style={styles.presets}>
            {WATER_PRESETS.map((ml) => {
              const on = profile.waterTargetMl === ml;
              return (
                <Pressable
                  key={ml}
                  style={({ pressed }) => [
                    styles.preset,
                    on && styles.presetOn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    setWaterRaw(String(ml));
                    commitWater(String(ml));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${ml} миллилитров`}
                >
                  <Text style={[styles.presetText, on && styles.presetTextOn]}>{ml}</Text>
                </Pressable>
              );
            })}
          </View>
          <LabeledField
            label="мл в день"
            value={waterRaw}
            onChangeText={setWaterRaw}
            onCommit={(t) => {
              setWaterRaw(t);
              commitWater(t);
            }}
            keyboardType="number-pad"
            placeholder="или своё число / пусто"
            accessibilityLabel="Цель воды в миллилитрах"
          />
        </SettingsCard>

        <SettingsCard title="Приватность" hint="Локально на устройстве" icon="shield-outline">
          <PrivacyRow
            icon="phone-portrait-outline"
            text="Дневник, вес и привычки хранятся локально на устройстве."
          />
          <PrivacyRow
            icon="barcode-outline"
            text="Штрихкод: в сеть уходит только код (Open Food Facts). Фото этикетки не загружаем."
          />
          <PrivacyRow
            icon="person-outline"
            text="Нет аккаунта, нет обязательного AI, нет рассылки данных."
          />
          <PrivacyRow
            icon="download-outline"
            text="Экспорт и полное удаление — только по твоей команде."
          />
        </SettingsCard>

        <SettingsCard
          title="Данные"
          hint="Экспорт / импорт · импорт заменяет локальные данные"
          icon="folder-outline"
        >
          <PrimaryButton label="Экспорт JSON в буфер" onPress={() => void onExport()} />
          <View style={{ height: space.sm }} />
          <PrimaryButton label="Загрузить демо 2 недели" onPress={onImportDemo} />
          <View style={{ height: space.sm }} />
          <PrimaryButton label="Импорт из буфера телефона" onPress={() => void onImportClipboard()} />
          <View style={{ height: space.sm }} />
          <PrimaryButton
            label="Вставить JSON"
            onPress={() => {
              setPasteRaw('');
              setPasteOpen(true);
            }}
          />
          <Pressable
            style={({ pressed }) => [styles.danger, pressed && styles.pressed]}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Удалить все локальные данные"
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.dangerText}>Удалить все локальные данные</Text>
          </Pressable>
        </SettingsCard>

        <Text style={styles.version}>Momentum · v0.1.0 · snapshot v9</Text>
      </FormScrollView>

      <Modal visible={pasteOpen} animationType="slide" accessibilityViewIsModal>
        <View
          style={[
            styles.pasteSheet,
            {
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
        >
          <View style={styles.pasteHead}>
            <Text style={styles.pasteTitle} accessibilityRole="header">
              Вставить JSON
            </Text>
            <Pressable
              onPress={() => setPasteOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <Text style={styles.pasteClose}>Закрыть</Text>
            </Pressable>
          </View>
          <Text style={styles.pasteHint}>
            Вставь сюда содержимое экспорта Momentum (Ctrl/Cmd+V или «Вставить» из меню). Не из
            буфера другого компьютера — только то, что уже на этом устройстве.
          </Text>
          <TextInput
            value={pasteRaw}
            onChangeText={setPasteRaw}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            placeholder='{ "version": 9, ... }'
            placeholderTextColor={colors.textMuted}
            style={styles.pasteInput}
            accessibilityLabel="JSON экспорта"
            textAlignVertical="top"
          />
          <PrimaryButton label="Проверить и восстановить" onPress={onImportPaste} />
        </View>
      </Modal>

      <FlashBar />
    </View>
  );
}

function SettingsCard({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={18} color={colors.text} />
        </View>
        <View style={styles.cardHeadText}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.cardHint}>{hint}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function LabeledField({
  label,
  value,
  onChangeText,
  onCommit,
  keyboardType,
  placeholder,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onCommit?: (text: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  placeholder?: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onEndEditing={(e) => onCommit?.(e.nativeEvent.text)}
        onSubmitEditing={(e) => onCommit?.(e.nativeEvent.text)}
        returnKeyType="done"
        blurOnSubmit
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={onCommit ? 'Сохраняется при уходе с поля' : undefined}
      />
    </View>
  );
}

function PrivacyRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.privacyRow}>
      <View style={styles.privacyIcon}>
        <Ionicons name={icon} size={16} color={colors.text} />
      </View>
      <Text style={styles.privacyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg },
  secondaryLinks: {
    marginBottom: space.lg,
    gap: space.xs,
  },
  secondaryLink: {
    paddingVertical: space.sm,
    minHeight: touchMin,
    justifyContent: 'center',
  },
  secondaryLinkText: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hero: { alignItems: 'center', marginBottom: space.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  name: { fontSize: type.title, fontWeight: '800', color: colors.text },
  meta: { fontSize: type.caption, color: colors.textSecondary, marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.md,
  },
  summaryChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  summaryText: { fontSize: type.micro, fontWeight: '700', color: colors.text },
  summaryEmpty: {
    marginTop: space.md,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  targetsHint: {
    marginTop: space.sm,
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
    gap: space.sm,
  },
  cardHead: { flexDirection: 'row', gap: space.md, marginBottom: space.sm },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadText: { flex: 1 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.text },
  cardHint: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  field: { marginBottom: space.xs },
  fieldLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    minHeight: touchMin,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.text,
  },
  macroRow: { flexDirection: 'row', gap: space.sm },
  macroCol: { flex: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xs },
  preset: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: 36,
    justifyContent: 'center',
  },
  presetOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  presetText: { fontWeight: '700', fontSize: type.caption, color: colors.text },
  presetTextOn: { color: colors.primaryButtonText },
  privacyRow: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    marginBottom: space.sm,
  },
  privacyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  privacyText: { flex: 1, fontSize: type.caption, color: colors.textSecondary, lineHeight: 18 },
  danger: {
    marginTop: space.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  pressed: { opacity: 0.88 },
  dangerText: { color: colors.danger, fontWeight: '700', fontSize: type.body },
  version: {
    marginTop: space.sm,
    marginBottom: space.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: type.caption,
  },
  pasteSheet: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
  },
  pasteHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  pasteTitle: { fontSize: type.title, fontWeight: '800', color: colors.text },
  pasteClose: { fontWeight: '700', color: colors.text, minHeight: touchMin, textAlignVertical: 'center' },
  pasteHint: {
    fontSize: type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: space.md,
  },
  pasteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: space.md,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
    marginBottom: space.md,
  },
});
