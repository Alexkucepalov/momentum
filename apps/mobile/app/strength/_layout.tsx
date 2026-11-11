import { Stack } from 'expo-router';

import { colors, type } from '@/src/theme/tokens';

export default function StrengthLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Силовые' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Тренировка' }} />
    </Stack>
  );
}
