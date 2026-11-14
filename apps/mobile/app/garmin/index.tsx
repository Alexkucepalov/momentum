import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { ThemedTextInput as TextInput } from "@/src/design-system/components/ThemedTextInput";
import { useRouter, type Href } from "expo-router";

import { FormScrollView } from "@/src/components/FormScrollView";
import {
  AppButton,
  AppCard,
  AppText,
  colors,
  radius,
  space,
  type,
} from "@/src/design-system";
import { verifyGarminApiKey } from "@/src/features/garmin/garminAuth";
import { GarminWarningsBlock } from "@/src/features/garmin/GarminWarningsBlock";
import {
  clearGarminApiKey,
  getGarminApiKey,
  setGarminApiKey,
} from "@/src/features/garmin/secureKeyStore";
import { runGarminSync } from "@/src/features/garmin/garminSyncService";
import { useData, useAnyRevision } from "@/src/state/DataContext";
import { confirmAction } from "@/src/utils/confirmAction";

const KEY_HELP_URL = "https://connect.garmin.com/app/settings/personalApiToken";

function formatSyncAt(iso: string | null): string {
  if (!iso) return "ещё не было";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GarminConnectScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const revision = useAnyRevision();
  void revision;

  const [keyRaw, setKeyRaw] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keyHint, setKeyHint] = useState<string | null>(null);
  const pendingRequest = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingRequest.current?.abort();
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [lastWarnings, setLastWarnings] = useState<string[]>([]);
  const sync = repo.getGarminSyncState();
  const imported = useMemo(
    () => ({
      weights: repo.listIntegratedWeights("garmin", 2000).length,
      workouts: repo.listIntegratedWorkouts("garmin", 2000).length,
      days: repo.listIntegratedDailyActivityStats("garmin", 2000).length,
      sleep: repo.listSleepNights(2000).filter((n) => n.source === "garmin")
        .length,
    }),
    [repo, revision],
  );

  const reloadKeyStatus = useCallback(async () => {
    const k = await getGarminApiKey();
    if (!mounted.current) return;
    setHasKey(!!k);
    setKeyHint(
      k
        ? `Сохранён на устройстве · ${k.length} символов · …${k.slice(-4)}`
        : null,
    );
  }, []);

  useEffect(() => {
    void reloadKeyStatus();
  }, [reloadKeyStatus]);

  const onSaveKey = async () => {
    if (busy || pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setBusy(true);
    setStatusNote(null);
    try {
      await setGarminApiKey(keyRaw);
      if (!mounted.current || controller.signal.aborted) return;
      setStatusNote("Ключ записан. Проверяю у Garmin…");
      await verifyGarminApiKey(keyRaw, controller.signal);
      if (!mounted.current) return;
      setKeyRaw("");
      await reloadKeyStatus();
      setStatusNote("Ключ сохранён и принят Garmin. Можно синхронизировать.");
      showFlash("Ключ Garmin сохранён и проверен");
      refresh();
    } catch (e) {
      if (!mounted.current) return;
      const msg = e instanceof Error ? e.message : "Не удалось сохранить ключ";
      setStatusNote(msg);
      showFlash(msg);
      // Keep key if store succeeded but verify failed — user can retry sync.
      await reloadKeyStatus();
      refresh();
    } finally {
      if (pendingRequest.current === controller) pendingRequest.current = null;
      if (mounted.current) setBusy(false);
    }
  };

  const onSync = async (mode: "full" | "incremental" = "incremental") => {
    if (busy || pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setBusy(true);
    setStatusNote(null);
    try {
      const result = await runGarminSync(repo, {
        mode,
        signal: controller.signal,
      });
      if (!mounted.current) return;
      refresh();
      setLastWarnings(result.warnings);
      if (!result.ok) {
        const msg = result.error ?? "Синхронизация не удалась";
        setStatusNote(msg);
        showFlash(msg);
        return;
      }
      const note = `Готово: вес ${result.weightsUpserted}, тренировки ${result.workoutsUpserted}, дни шагов ${result.stepsUpserted}, сон ${result.sleepUpserted}`;
      setStatusNote(
        result.warnings.length > 0
          ? `${note}. Есть предупреждения — раскрой блок ниже.`
          : note,
      );
      showFlash(
        mode === "full"
          ? `Полная выгрузка: ${result.workoutsUpserted} тр. / ${result.stepsUpserted} дн.`
          : note,
      );
    } finally {
      if (pendingRequest.current === controller) pendingRequest.current = null;
      if (mounted.current) setBusy(false);
      if (mounted.current) await reloadKeyStatus();
    }
  };

  const onDisconnect = () => {
    confirmAction(
      "Отключить Garmin?",
      "Ключ удалится с устройства. Уже импортированные записи останутся.",
      {
        destructive: true,
        confirmLabel: "Отключить",
        onConfirm: () => {
          void (async () => {
            try {
              await clearGarminApiKey();
              await reloadKeyStatus();
              setStatusNote("Garmin отключён, ключ удалён");
              showFlash("Garmin отключён");
              refresh();
            } catch (e) {
              showFlash(
                e instanceof Error ? e.message : "Не удалось отключить Garmin",
              );
            }
          })();
        },
      },
    );
  };

  const statusLabel = !hasKey
    ? "Не подключено"
    : busy
      ? "Идёт запрос…"
      : sync.lastError && !sync.lastSuccessfulSyncAt
        ? "Ошибка"
        : sync.lastSuccessfulSyncAt
          ? "Подключено"
          : "Ключ на устройстве";

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <AppCard style={styles.card}>
          <AppText variant="label" tone="secondary">
            СТАТУС
          </AppText>
          <AppText variant="title" style={styles.status}>
            {statusLabel}
          </AppText>
          {keyHint ? (
            <AppText variant="caption" tone="secondary" style={styles.line}>
              {keyHint}
            </AppText>
          ) : (
            <AppText variant="caption" tone="muted" style={styles.line}>
              Ключ ещё не сохранён на телефоне
            </AppText>
          )}
          <AppText
            variant="caption"
            tone="secondary"
            style={styles.line}
            testID="garmin-last-sync"
          >
            Последняя успешная: {formatSyncAt(sync.lastSuccessfulSyncAt)}
          </AppText>
          {sync.lastSyncedFrom && sync.lastSyncedTo ? (
            <AppText variant="caption" tone="muted" style={styles.line}>
              Окно данных: {sync.lastSyncedFrom} → {sync.lastSyncedTo}
            </AppText>
          ) : (
            <AppText variant="caption" tone="muted" style={styles.line}>
              После первой полной выгрузки появится окно дат.
            </AppText>
          )}
          {statusNote ? (
            <AppText
              variant="caption"
              tone={
                statusNote.toLowerCase().includes("ошиб") ||
                statusNote.includes("HTTP")
                  ? "danger"
                  : "secondary"
              }
              style={styles.note}
            >
              {statusNote}
            </AppText>
          ) : null}
          <GarminWarningsBlock
            lines={
              lastWarnings.length > 0
                ? lastWarnings
                : sync.lastError && !statusNote
                  ? [sync.lastError]
                  : []
            }
          />
          <AppText variant="caption" tone="secondary" style={styles.line}>
            В базе: вес {imported.weights} · тренировки {imported.workouts} ·
            дни шагов {imported.days} · сон {imported.sleep}
          </AppText>
          <AppButton
            label="Открыть все данные Garmin"
            variant="secondary"
            onPress={() => router.push("/garmin/data" as Href)}
            disabled={busy}
          />
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="subtitle">Personal API Key</AppText>
          <AppText variant="caption" tone="secondary" style={styles.hint}>
            Garmin Connect (веб) → Settings → Personal API Key → Create Key.
            Вставь только сам ключ, без слова ApiKey и без кавычек. При
            сохранении приложение сразу проверит ключ у Garmin.
          </AppText>
          <TextInput
            value={keyRaw}
            onChangeText={setKeyRaw}
            placeholder={
              hasKey ? "Новый ключ (чтобы заменить)" : "Вставь API key"
            }
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            secureTextEntry
            style={styles.input}
            accessibilityLabel="Garmin Personal API Key"
          />
          <AppButton
            label={busy ? "Проверка…" : "Сохранить и проверить ключ"}
            onPress={() => void onSaveKey()}
            disabled={!keyRaw.trim() || busy}
          />
          <View style={{ height: space.sm }} />
          <AppButton
            label="Открыть страницу ключа в Garmin"
            variant="secondary"
            onPress={() => void Linking.openURL(KEY_HELP_URL)}
            disabled={busy}
          />
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="subtitle">Синхронизация</AppText>
          <AppText variant="caption" tone="secondary" style={styles.hint}>
            «Полная выгрузка» тянет до 3 лет: шаги кусками по 28 дней, все
            activity без даты + детали (пульс, зоны, мощность, ккал). Обычная
            кнопка — только с последней даты. Вес появится только если он есть в
            Garmin Connect.
          </AppText>
          <AppButton
            label={busy ? "Синхронизация…" : "Полная выгрузка из Garmin"}
            onPress={() => void onSync("full")}
            disabled={!hasKey || busy}
          />
          <View style={{ height: space.sm }} />
          <AppButton
            label={busy ? "Синхронизация…" : "Обновить с последней даты"}
            variant="secondary"
            onPress={() => void onSync("incremental")}
            disabled={!hasKey || busy}
          />
          <View style={{ height: space.sm }} />
          <AppButton
            label="Отключить Garmin"
            variant="secondary"
            onPress={onDisconnect}
            disabled={!hasKey || busy}
          />
        </AppCard>

        <AppText variant="caption" tone="muted" style={styles.footnote}>
          Если снова HTTP 400 на ключе — создай новый Personal API Key в Garmin
          Connect и сохрани заново. Не присылай ключ в чат.
        </AppText>
      </FormScrollView>
      {busy ? (
        <SafeAreaView edges={["bottom"]} style={styles.cancelDock}>
          <AppButton
            label="Отменить запрос"
            variant="secondary"
            onPress={() => {
              setStatusNote("Отменяем запрос…");
              pendingRequest.current?.abort();
            }}
            testID="garmin-cancel"
          />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelDock: {
    padding: space.lg,
    backgroundColor: colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  root: { flex: 1 },
  content: { padding: space.lg, paddingBottom: 48, gap: space.md },
  card: { gap: space.sm },
  status: { marginTop: 4 },
  line: { marginTop: 2 },
  note: { marginTop: space.sm, lineHeight: 18 },
  hint: { lineHeight: 18 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 48,
    fontSize: type.body,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  footnote: { lineHeight: 18 },
});
