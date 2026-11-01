import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseExportJson, summarizeSnapshot } from '../../../../src/domain/importExport';
import { localDateKey } from '../../../../src/storage/validation';
import { FlashBar } from '@/src/components/FlashBar';
import { FormScrollView } from '@/src/components/FormScrollView';
import { ZeppCsvImportCard } from '@/src/features/weight/ZeppCsvImportCard';
import { collectDayReportText } from '@/src/features/progress/collectDayReport';
import { useData } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';
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
  const router = useRouter();
  const { repo, refresh, revision, showFlash, setDateLocal, dateLocal } = useData();
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
          'Буфер Mac и телефона — разные. На телефоне: «Вставить JSON» или скопируй экспорт в буфер устройства.',
        );
        return;
      }
      confirmAndImport(json, 'Из буфера обмена');
    } catch {
      alertMessage('Импорт', 'Не удалось прочитать буфер — используй «Вставить JSON».');
    }
  };

  const onCopyDayReport = async () => {
    try {
      const text = collectDayReportText(repo, dateLocal);
      await Clipboard.setStringAsync(text);
      showFlash('Отчёт за день скопирован — вставь в ChatGPT');
    } catch (e) {
      alertMessage('Отчёт', e instanceof Error ? e.message : 'Не удалось скопировать');
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
        <View style={styles.hero} testID="profile-hero">
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.ink} />
          </View>
          <AppText variant="title" style={styles.name} accessibilityRole="header">
            Профиль
          </AppText>
          <AppText variant="caption" tone="secondary">
            nf-fit · только на устройстве · {profile.timezone}
          </AppText>
          {summary.length > 0 ? (
            <View style={styles.summaryRow} accessibilityLabel={`Активные цели: ${summary.join(', ')}`}>
              {summary.map((chip) => (
                <View key={chip} style={styles.summaryChip}>
                  <AppText variant="label">{chip}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText variant="caption" tone="muted" style={styles.summaryEmpty}>
              Цели пока не заданы — всё опционально
            </AppText>
          )}
        </View>

        <SettingsCard
          title="КБЖУ на день"
          hint="Твои числа, без автонорм. Сохраняется, когда уходишь с поля. Пусто = без цели."
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
        </SettingsCard>

        <SettingsCard
          title="Рост"
          hint="Для ИМТ в Прогрессе. Сохраняется при уходе с поля. Справочно, не диагноз."
          icon="resize-outline"
        >
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

        <SettingsCard
          title="Вода"
          hint="Мягкая подсказка на Сегодня. Пресет или своё число — сохраняется сразу."
          icon="water-outline"
        >
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

        <SettingsCard
          title="Garmin"
          hint="Personal API: вес, тренировки и шаги. Ключ на устройстве. Автосинк при открытии приложения."
          icon="watch-outline"
        >
          <AppButton label="Настроить Garmin" onPress={() => router.push('/garmin' as Href)} />
          <View style={{ height: space.sm }} />
          <AppButton
            label="Данные Garmin"
            variant="secondary"
            onPress={() => router.push('/garmin/data' as Href)}
          />
        </SettingsCard>

        <ZeppCsvImportCard />

        <SettingsCard title="Приватность" hint="Коротко о том, куда уходят данные." icon="shield-outline">
          <PrivacyRow
            icon="phone-portrait-outline"
            text="Дневник, вес и привычки хранятся локально на устройстве."
          />
          <PrivacyRow
            icon="barcode-outline"
            text="Штрихкод: в сеть уходит только код (Open Food Facts). Фото этикетки не загружаем."
          />
          <PrivacyRow
            icon="watch-outline"
            text="Garmin Personal API: запросы идут в Garmin по твоему ключу; ключ в SecureStore, не в экспорте."
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
          title="Отчёт для ChatGPT"
          hint="Прямого коннекта нет — данные не уходят сами. Копируешь текст за выбранный день и вставляешь вручную."
          icon="chatbubble-ellipses-outline"
        >
          <AppButton
            label="Копировать отчёт за день"
            onPress={() => void onCopyDayReport()}
          />
          <AppText variant="caption" tone="muted" style={styles.reportHint}>
            День = текущая дата в приложении. Период и PDF — во вкладке Прогресс · Отчёты.
          </AppText>
        </SettingsCard>

        <SettingsCard
          title="Данные"
          hint="Экспорт в буфер телефона. Импорт заменяет все локальные данные. Буфер компьютера сюда не попадает."
          icon="folder-outline"
        >
          <AppButton label="Экспорт JSON в буфер" onPress={() => void onExport()} />
          <View style={{ height: space.sm }} />
          <AppButton
            label="Импорт из буфера телефона"
            variant="secondary"
            onPress={() => void onImportClipboard()}
          />
          <View style={{ height: space.sm }} />
          <AppButton
            label="Вставить JSON"
            variant="secondary"
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
            <AppText variant="caption" tone="danger">
              Удалить все локальные данные
            </AppText>
          </Pressable>
        </SettingsCard>

        <AppText variant="caption" tone="muted" style={styles.version}>
          nf-fit · v0.1.0 · offline
        </AppText>
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
            <AppText variant="title" accessibilityRole="header">
              Вставить JSON
            </AppText>
            <Pressable
              onPress={() => setPasteOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
            >
              <AppText variant="body" tone="accent">
                Закрыть
              </AppText>
            </Pressable>
          </View>
          <AppText variant="caption" tone="secondary" style={styles.pasteHint}>
            Вставь сюда содержимое экспорта nf-fit (Ctrl/Cmd+V или «Вставить» из меню). Не из
            буфера другого компьютера — только то, что уже на этом устройстве.
          </AppText>
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
          <AppButton label="Проверить и восстановить" onPress={onImportPaste} />
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
    <AppCard style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={18} color={colors.ink} />
        </View>
        <View style={styles.cardHeadText}>
          <AppText variant="subtitle" style={styles.cardTitle} accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {hint}
          </AppText>
        </View>
      </View>
      {children}
    </AppCard>
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
        <Ionicons name={icon} size={16} color={colors.ink} />
      </View>
      <AppText variant="caption" tone="secondary" style={styles.privacyText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: space.lg },
  hero: { alignItems: 'center', marginBottom: space.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  name: { fontWeight: '800' },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
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
  reportHint: {
    marginTop: space.sm,
    lineHeight: 18,
  },
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
