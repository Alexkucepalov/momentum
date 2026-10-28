import { Stack } from 'expo-router';

import { nothing, nothingType } from '@/src/theme/nothing';

export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: nothing.bg },
        headerTitleStyle: {
          color: nothing.display,
          fontWeight: '700',
          fontSize: nothingType.title,
          letterSpacing: 0.4,
        },
        headerTintColor: nothing.display,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: nothing.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'План питания' }} />
      <Stack.Screen name="eat-now" options={{ title: 'Что съесть сейчас?' }} />
      <Stack.Screen name="my-products" options={{ title: 'Мои продукты' }} />
      <Stack.Screen name="week" options={{ title: 'Меню на неделю' }} />
      {/* Soft-removed surfaces — deep links redirect to hub (ADR-009). */}
      <Stack.Screen name="pantry" options={{ title: 'План' }} />
      <Stack.Screen name="shop" options={{ title: 'План' }} />
      <Stack.Screen name="budget" options={{ title: 'План' }} />
      <Stack.Screen name="stores" options={{ title: 'План' }} />
      <Stack.Screen name="receipt" options={{ title: 'План' }} />
    </Stack>
  );
}
