import { Stack } from 'expo-router';

import { colors, fonts, type } from '@/src/theme/tokens';

export default function StrengthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontFamily: fonts.medium, fontWeight: 'normal', fontSize: type.subtitle + 4 },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Силовые' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Тренировка' }} />
      <Stack.Screen name="template/[id]" options={{ title: 'Шаблон' }} />
    </Stack>
  );
}
