import { Stack } from 'expo-router';

import { colors, type } from '@/src/theme/tokens';

export default function GarminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: type.title },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Garmin' }} />
      <Stack.Screen name="data" options={{ title: 'Данные Garmin' }} />
      <Stack.Screen name="workout/[id]" options={{ title: 'Тренировка' }} />
    </Stack>
  );
}
