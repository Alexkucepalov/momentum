import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "react-native-reanimated";

import { asPersistable } from "../../../src/storage/foodRepository";
import type { FoodRepository } from "../../../src/storage/foodRepository";
import {
  openPersistentFoodRepository,
  readRecoveryPayload,
} from "@/src/storage/expoFoodStore";
import { saveRecoveryCopy } from "@/src/storage/recoveryCopy";
import { FeedbackHost } from "@/src/components/FeedbackHost";
import { DataProvider } from "@/src/state/DataContext";
import { AppButton, AppText, colors, space } from "@/src/design-system";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function openStorage(): { repo: FoodRepository | null } {
  try {
    return { repo: openPersistentFoodRepository() };
  } catch {
    // Never turn an unreadable database into an apparently empty, non-durable diary.
    return { repo: null };
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ManropeRegular: require("../assets/fonts/Manrope_400Regular.ttf"),
    ManropeMedium: require("../assets/fonts/Manrope_500Medium.ttf"),
    ManropeSemiBold: require("../assets/fonts/Manrope_600SemiBold.ttf"),
  });
  const [storage, setStorage] = useState(openStorage);
  const [persistBroken, setPersistBroken] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const repo = storage.repo;
  useEffect(() => {
    if (!repo) return;
    const persistent = asPersistable(repo);
    persistent.setPersistStatusListener((error) =>
      setPersistBroken(error != null),
    );
    return () => persistent.setPersistStatusListener(null);
  }, [repo]);

  useEffect(() => {
    if (fontsLoaded || fontError)
      SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.root}>
        {!repo ? (
          <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.storageError}>
              <AppText variant="title">Хранилище недоступно</AppText>
              <AppText tone="secondary">
                Не удалось открыть локальные данные. Приложение не создаёт
                пустой дневник поверх них. Попробуй открыть хранилище ещё раз.
              </AppText>
              <AppButton
                label="Повторить"
                onPress={() => setStorage(openStorage())}
                testID="storage-open-retry"
              />
              <AppButton
                label="Сохранить копию для восстановления"
                variant="secondary"
                disabled={recovering}
                testID="storage-recovery-export"
                onPress={() => {
                  void (async () => {
                    setRecovering(true);
                    try {
                      const raw = readRecoveryPayload();
                      if (!raw) throw new Error("Нет доступной копии");
                      await saveRecoveryCopy(raw);
                      setRecoveryMessage(
                        "Копия подготовлена. Исходные данные не изменены.",
                      );
                    } catch {
                      setRecoveryMessage(
                        "Не удалось подготовить копию. Можно повторить попытку.",
                      );
                    } finally {
                      setRecovering(false);
                    }
                  })();
                }}
              />
              <AppText variant="caption" tone="secondary">
                Копия может содержать личные записи. Выбирай место хранения
                самостоятельно.
              </AppText>
              {recoveryMessage ? (
                <AppText variant="caption" accessibilityRole="alert">
                  {recoveryMessage}
                </AppText>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        ) : (
          <DataProvider repo={repo}>
            {persistBroken ? (
              <SafeAreaView
                edges={["top"]}
                style={styles.persistWarning}
                testID="persistence-warning"
              >
                <AppText
                  variant="caption"
                  tone="danger"
                  accessibilityRole="alert"
                >
                  Не удалось сохранить изменения. Пока они находятся в памяти
                  приложения.
                </AppText>
                <AppButton
                  variant="secondary"
                  label="Повторить сохранение"
                  onPress={() => {
                    try {
                      asPersistable(repo).flushPersist();
                    } catch {
                      /* The warning stays visible. */
                    }
                  }}
                />
              </SafeAreaView>
            ) : null}
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.canvas },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="recipes" options={{ headerShown: false }} />
              <Stack.Screen name="plan" options={{ headerShown: false }} />
              <Stack.Screen name="garmin" options={{ headerShown: false }} />
              <Stack.Screen name="strength" options={{ headerShown: false }} />
            </Stack>
            <FeedbackHost />
          </DataProvider>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  storageError: {
    flexGrow: 1,
    padding: space.screen,
    justifyContent: "center",
    gap: space.lg,
  },
  persistWarning: {
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surfaceMuted,
  },
  root: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: colors.canvas,
  },
});
