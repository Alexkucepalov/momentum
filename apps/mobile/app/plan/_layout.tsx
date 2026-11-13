import { Stack } from 'expo-router';

import { colors, fonts, type } from '@/src/theme/tokens';

export default function PlanLayout() {
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
      <Stack.Screen name="index" options={{ title: 'План питания' }} />
      <Stack.Screen name="eat-now" options={{ title: 'Что съесть сейчас?' }} />
      <Stack.Screen name="pantry" options={{ title: 'Запасы дома' }} />
      <Stack.Screen name="week" options={{ title: 'Доска недели' }} />
      <Stack.Screen name="shop" options={{ title: 'Мои покупки' }} />
      <Stack.Screen name="budget" options={{ title: 'Бюджет питания' }} />
      <Stack.Screen name="stores" options={{ title: 'Магазины' }} />
      <Stack.Screen name="receipt" options={{ title: 'Импорт покупки' }} />
    </Stack>
  );
}
