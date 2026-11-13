import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { createMemoryFoodRepository } from '../../../src/storage/foodRepository';
import type { FoodRepository } from '../../../src/storage/foodRepository';
import { openPersistentFoodRepository } from '@/src/storage/expoFoodStore';
import { DataProvider } from '@/src/state/DataContext';
import { colors } from '@/src/design-system';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function createRepo(): FoodRepository {
  try {
    return openPersistentFoodRepository();
  } catch {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return createMemoryFoodRepository({ timezone });
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ManropeRegular: require('../assets/fonts/Manrope_400Regular.ttf'),
    ManropeMedium: require('../assets/fonts/Manrope_500Medium.ttf'),
    ManropeSemiBold: require('../assets/fonts/Manrope_600SemiBold.ttf'),
  });
  const [repo] = useState(createRepo);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <DataProvider repo={repo}>
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recipes" options={{ headerShown: false }} />
            <Stack.Screen name="plan" options={{ headerShown: false }} />
            <Stack.Screen name="garmin" options={{ headerShown: false }} />
            <Stack.Screen name="strength" options={{ headerShown: false }} />
          </Stack>
        </DataProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: colors.canvas,
  },
});
