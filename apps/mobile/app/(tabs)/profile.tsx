import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedTextInput as TextInput } from '@/src/design-system/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parseExportJson, summarizeSnapshot } from '../../../../src/domain/importExport';
import { localDateKey } from '../../../../src/storage/validation';
import { asPersistable } from '../../../../src/storage/foodRepository';
import { clearRecoveryCopies } from '@/src/storage/recoveryCopy';
import { FormScrollView } from '@/src/components/FormScrollView';
import { ZeppCsvImportCard } from '@/src/features/weight/ZeppCsvImportCard';
import { collectDayReportText } from '@/src/features/progress/collectDayReport';
import { useData, useProfileRevision } from '@/src/state/DataContext';
import {
  AppButton,
  AppCard,
  AppText,
  Field,
  colors,
  radius,
  space,
  touchMin,
  type,
} from '@/src/design-system';
import { bumpLocalDataWipeEpoch } from '../../../../src/domain/localDataWipeEpoch';
import { clearGarminApiKey, getGarminApiKey } from '@/src/features/garmin/secureKeyStore';
import { clearRecipePhotos } from '@/src/media/recipePhoto';
import { clearTodayWidgetPayload } from '@/src/widgets/syncTodayWidget';
import { alertMessage, confirmAction } from '@/src/utils/confirmAction';

function formatGarminGlance(args: {
  hasKey: boolean | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
}): string {
  if (args.hasKey === false) return 'Не подключено';
  if (args.hasKey === null) return 'Проверка…';
  if (args.lastError && !args.lastSuccessfulSyncAt) return 'Ошибка синхронизации';
  if (args.lastSuccessfulSyncAt) {
    try {
      return `Готово · ${new Date(args.lastSuccessfulSyncAt).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return 'Готово';
    }
  }
  return 'Ключ есть · ещё не синхронизировали';
}

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
  const params = useLocalSearchParams<{ section?: string }>();
  const [goalsOpen, setGoalsOpen] = useState(params.section === 'goals');
  useEffect(() => { if (params.section === 'goals') setGoalsOpen(true); }, [params.section]);
  const { repo, refresh, showFlash, setDateLocal, dateLocal, setUndo } = useData();
  const profileRevision = useProfileRevision();
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
  const [zeppOpen, setZeppOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [garminHasKey, setGarminHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const next = profileToFields(repo.getProfile());
    setWaterRaw(next.waterRaw);
    setHeightRaw(next.heightRaw);
    setKcalRaw(next.kcalRaw);
    setProteinRaw(next.proteinRaw);
    setFatRaw(next.fatRaw);
    setCarbRaw(next.carbRaw);
  }, [repo, profileRevision]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const key = await getGarminApiKey();
      if (!cancelled) setGarminHasKey(Boolean(key));
    })();
    return () => {
      cancelled = true;
    };
  }, [profileRevision]);

  const glance = useMemo(() => {
    return {
      kcal: profile.dailyEnergyKcal == null ? '—' : String(Math.round(profile.dailyEnergyKcal)),
      water: profile.waterTargetMl == null ? '—' : String(profile.waterTargetMl),
      height: profile.heightCm == null ? '—' : String(profile.heightCm),
    };
  }, [profile]);

  const garminSync = repo.getGarminSyncState();
  const garminMeta = formatGarminGlance({
    hasKey: garminHasKey,
    lastSuccessfulSyncAt: garminSync.lastSuccessfulSyncAt,
    lastError: garminSync.lastError,
  });

  const parseOptionalPositive = (raw: string, label: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new Error(`${label}: число ≥ 0 или пусто`);
    return n;
  };

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
      refresh('profile');
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
      refresh('profile');
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
      refresh('profile');
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
    bumpLocalDataWipeEpoch();
    setUndo(null);
    const tz = repo.getProfile().timezone;
    setDateLocal(localDateKey(new Date(), tz));
    refresh('all');
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
      'Продукты, дневник, вес, привычки, ключ Garmin и виджеты на этом устройстве. Сначала сделай экспорт.',
      {
        confirmLabel: 'Удалить',
        destructive: true,
        onConfirm: () => {
          void (async () => {
            bumpLocalDataWipeEpoch();
            setUndo(null);
            try {
              repo.deleteAllUserData();
              setDateLocal(localDateKey(new Date(), repo.getProfile().timezone));
              refresh('all');
              const cleanup = await Promise.allSettled([clearGarminApiKey(), clearTodayWidgetPayload(), clearRecoveryCopies(), clearRecipePhotos()]);
              asPersistable(repo).flushPersist();
              router.replace('/');
              refresh('all');
              if (cleanup.some(result => result.status === 'rejected')) showFlash('Часть локальных файлов или ключ Garmin удалить не удалось. Повтори удаление.');
              else showFlash('Локальные данные и ключ Garmin очищены');
            } catch {
              refresh('all');
              showFlash('Удаление не завершилось. Повтори попытку; сохранение может быть недоступно.');
            }
          })();
        },
      },
    );
  };

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content} testID="profile-screen">
        <AppCard style={styles.goalsCard} testID="profile-goals">
          <Pressable onPress={() => setGoalsOpen(v => !v)} accessibilityRole="button" accessibilityLabel="Изменить ориентиры" accessibilityState={{ expanded: goalsOpen }} style={styles.goalsHead}>
            <AppText variant="subtitle">Ориентиры</AppText>
            <Ionicons name={goalsOpen ? 'chevron-up' : 'arrow-forward'} size={18} color={colors.ink} />
          </Pressable>
          <View
            style={styles.glanceRow}
            testID="profile-hero"
            accessibilityRole="header"
            accessibilityLabel="Кратко по целям"
          >
            <GlanceCell label="ккал" value={glance.kcal} />
            <View style={styles.glanceRule} />
            <GlanceCell
              label="вода"
              value={glance.water}
              unit={glance.water === '—' ? undefined : 'мл'}
            />
            <View style={styles.glanceRule} />
            <GlanceCell
              label="рост"
              value={glance.height}
              unit={glance.height === '—' ? undefined : 'см'}
            />
          </View>

          {goalsOpen ? <View>
          <Field
            label="Килокалории в день"
            value={kcalRaw}
            onChangeText={setKcalRaw}
            onEndEditing={(e) => {
              const t = e.nativeEvent.text;
              setKcalRaw(t);
              commitDailyTargets({ kcal: t });
            }}
            keyboardType="decimal-pad"
            placeholder="например 2200"
            returnKeyType="done"
            blurOnSubmit
            helper="Пусто = без цели. Сохраняется при уходе с поля."
            accessibilityLabel="Цель килокалорий на день"
          />

          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Field
                label="Белки, г"
                value={proteinRaw}
                onChangeText={setProteinRaw}
                onEndEditing={(e) => {
                  const t = e.nativeEvent.text;
                  setProteinRaw(t);
                  commitDailyTargets({ protein: t });
                }}
                keyboardType="decimal-pad"
                placeholder="—"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Цель белков в граммах"
              />
            </View>
            <View style={styles.macroCol}>
              <Field
                label="Жиры, г"
                value={fatRaw}
                onChangeText={setFatRaw}
                onEndEditing={(e) => {
                  const t = e.nativeEvent.text;
                  setFatRaw(t);
                  commitDailyTargets({ fat: t });
                }}
                keyboardType="decimal-pad"
                placeholder="—"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Цель жиров в граммах"
              />
            </View>
            <View style={styles.macroCol}>
              <Field
                label="Углеводы, г"
                value={carbRaw}
                onChangeText={setCarbRaw}
                onEndEditing={(e) => {
                  const t = e.nativeEvent.text;
                  setCarbRaw(t);
                  commitDailyTargets({ carb: t });
                }}
                keyboardType="decimal-pad"
                placeholder="—"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Цель углеводов в граммах"
              />
            </View>
          </View>

          <View style={styles.softSplit} />

          <AppText variant="label" tone="muted" style={styles.inlineLabel}>
            Вода, мл
          </AppText>
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
                  <AppText variant="caption" style={[styles.presetText, on && styles.presetTextOn]}>
                    {ml}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.twoCol}>
            <View style={styles.twoColItem}>
              <Field
                label="Своё значение"
                value={waterRaw}
                onChangeText={setWaterRaw}
                onEndEditing={(e) => {
                  const t = e.nativeEvent.text;
                  setWaterRaw(t);
                  commitWater(t);
                }}
                keyboardType="number-pad"
                placeholder="пусто = без цели"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Цель воды в миллилитрах"
              />
            </View>
            <View style={styles.twoColItem}>
              <Field
                label="Рост, см"
                value={heightRaw}
                onChangeText={setHeightRaw}
                onEndEditing={(e) => {
                  const t = e.nativeEvent.text;
                  setHeightRaw(t);
                  commitHeight(t);
                }}
                keyboardType="decimal-pad"
                placeholder="для ИМТ"
                helper="Справочно"
                returnKeyType="done"
                blurOnSubmit
                accessibilityLabel="Рост в сантиметрах"
              />
            </View>
          </View>
          <AppButton label="Готово" variant="secondary" onPress={() => setGoalsOpen(false)} />
          </View> : null}
        </AppCard>

        <GroupLabel>Подключения</GroupLabel>
        <View style={styles.sheet} testID="profile-links">
          <LinkRow
            icon="watch-outline"
            title="Garmin"
            meta={garminMeta}
            onPress={() => router.push('/garmin' as Href)}
          />
          <LinkRow
            icon="list-outline"
            title="Данные Garmin"
            meta="История синхронизации"
            onPress={() => router.push('/garmin/data' as Href)}
          />
          <LinkRow
            icon="scale-outline"
            title="Вес Xiaomi / Zepp"
            meta="Импорт BODY CSV"
            onPress={() => setZeppOpen((v) => !v)}
            last={!zeppOpen}
            chevron={zeppOpen ? 'chevron-up' : 'chevron-down'}
          />
          {zeppOpen ? (
            <View style={styles.nested}>
              <ZeppCsvImportCard />
            </View>
          ) : null}
        </View>

        <GroupLabel>Данные</GroupLabel>
        <View style={styles.sheet} testID="profile-data">
          <LinkRow
            icon="share-outline"
            title="Экспорт JSON"
            meta="Копия в буфер"
            onPress={() => void onExport()}
          />
          <LinkRow
            icon="download-outline"
            title="Импорт из буфера"
            meta="Заменит локальные данные"
            onPress={() => void onImportClipboard()}
          />
          <LinkRow
            icon="code-slash-outline"
            title="Вставить JSON"
            meta="С другого устройства"
            onPress={() => {
              setPasteRaw('');
              setPasteOpen(true);
            }}
          />
          <LinkRow
            icon="chatbubble-ellipses-outline"
            title="Отчёт за день"
            meta="Текст для ChatGPT"
            onPress={() => void onCopyDayReport()}
            last
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.dangerQuiet, pressed && styles.pressed]}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Удалить все локальные данные"
        >
          <AppText variant="caption" tone="danger" style={styles.dangerQuietText}>
            Удалить все локальные данные
          </AppText>
        </Pressable>

        <GroupLabel>Приватность</GroupLabel>
        <View style={styles.sheet} testID="profile-privacy">
          <LinkRow
            icon="shield-checkmark-outline"
            title="Как хранятся данные"
            meta={privacyOpen ? 'Свернуть' : 'Коротко и по делу'}
            onPress={() => setPrivacyOpen((v) => !v)}
            last={!privacyOpen}
            chevron={privacyOpen ? 'chevron-up' : 'chevron-down'}
          />
          {privacyOpen ? (
            <View style={styles.privacyBody}>
              <PrivacyLine text="Дневник, вес и привычки хранятся на устройстве. В Android автоматическое резервное копирование приложения отключено." />
              <PrivacyLine text="Для переноса используй экспорт JSON. Фото рецептов в JSON не входят." />
              <PrivacyLine text="Штрихкод: в сеть уходит только код (Open Food Facts)." />
              <PrivacyLine text="Garmin-ключ в SecureStore, не попадает в экспорт." />
              <PrivacyLine text="Нет аккаунта, нет обязательного AI, нет рассылки." />
              <PrivacyLine text="Экспорт и удаление — только по твоей команде." last />
            </View>
          ) : null}
        </View>

        <AppText variant="caption" tone="muted" style={styles.version}>
          nf-fit · v0.1.0
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
            Вставь экспорт nf-fit с этого устройства. Буфер Mac и телефона — разные.
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

    </View>
  );
}

function GroupLabel({ children, tight }: { children: ReactNode; tight?: boolean }) {
  return (
    <AppText
      variant="label"
      tone="muted"
      style={[styles.groupLabel, tight && styles.groupLabelTight]}
    >
      {children}
    </AppText>
  );
}

function GlanceCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.glanceCell}>
      <AppText variant="label" tone="muted" style={styles.glanceLabel}>
        {label}
      </AppText>
      <AppText variant="subtitle" style={styles.glanceValue}>
        {value}
        {unit ? (
          <AppText variant="caption" tone="muted">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
    </View>
  );
}

function LinkRow({
  icon,
  title,
  meta,
  onPress,
  last,
  chevron = 'chevron-forward',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  onPress: () => void;
  last?: boolean;
  chevron?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        !last && styles.linkRowBorder,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${meta}`}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={18} color={colors.ink} />
      </View>
      <View style={styles.linkText}>
        <AppText variant="body" style={styles.linkTitle}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {meta}
        </AppText>
      </View>
      <Ionicons name={chevron} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function PrivacyLine({ text, last }: { text: string; last?: boolean }) {
  return (
    <View style={[styles.privacyLine, !last && styles.privacyLineBorder]}>
      <View style={styles.privacyDot} />
      <AppText variant="caption" tone="secondary" style={styles.privacyText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: space.screen,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    marginBottom: space.md,
  },
  glanceCell: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: space.sm,
    gap: space.xs,
  },
  glanceLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  glanceValue: { fontSize: 25, fontWeight: '500', letterSpacing: -0.7 },
  glanceRule: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  groupLabel: {
    marginTop: space.md,
    marginBottom: space.xs,
    paddingHorizontal: space.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupLabelTight: {
    marginTop: 0,
  },
  goalsHead: { minHeight: touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalsCard: {
    padding: space.lg,
    gap: 0,
  },
  macroRow: { flexDirection: 'row', gap: space.sm },
  macroCol: { flex: 1 },
  softSplit: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: space.md,
    marginTop: space.xs,
  },
  inlineLabel: {
    fontWeight: '700',
    marginBottom: space.sm,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  preset: {
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
    minHeight: touchMin,
    justifyContent: 'center',
  },
  presetOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  presetText: { fontWeight: '700' },
  presetTextOn: { color: colors.onAccent },
  twoCol: { flexDirection: 'row', gap: space.sm },
  twoColItem: { flex: 1 },
  sheet: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchMin + 12,
    paddingHorizontal: 0,
    paddingVertical: space.md,
  },
  linkRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, gap: 2, minWidth: 0 },
  linkTitle: { fontWeight: '600' },
  nested: {
    padding: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.canvas,
  },
  privacyBody: {
    paddingHorizontal: space.screen,
    paddingBottom: space.md,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  privacyLine: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    paddingVertical: space.sm,
  },
  privacyLineBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  privacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginTop: 6,
  },
  privacyText: { flex: 1, lineHeight: 18 },
  dangerQuiet: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchMin,
    marginTop: space.xs,
  },
  dangerQuietText: { fontWeight: '600' },
  pressed: { opacity: 0.88 },
  version: {
    marginTop: space.xl,
    textAlign: 'center',
  },
  pasteSheet: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: space.screen,
  },
  pasteHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  pasteHint: {
    lineHeight: 18,
    marginBottom: space.md,
  },
  pasteInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: space.md,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.ink,
    marginBottom: space.md,
  },
});
