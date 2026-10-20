import { Stack } from 'expo-router';

import { colors, type } from '@/src/theme/tokens';

export default function PlanLayout() {
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
      <Stack.Screen name="index" options={{ title: 'План питания' }} />
      <Stack.Screen name="eat-now" options={{ title: 'Что съесть сейчас?' }} />
      <Stack.Screen name="pantry" options={{ title: 'Запасы дома' }} />
      <Stack.Screen name="week" options={{ title: 'Меню на неделю' }} />
      <Stack.Screen name="shop" options={{ title: 'Мои покупки' }} />
      <Stack.Screen name="budget" options={{ title: 'Бюджет питания' }} />
      <Stack.Screen name="stores" options={{ title: 'Магазины' }} />
      <Stack.Screen name="receipt" options={{ title: 'Чек вручную' }} />
    </Stack>
  );
}
