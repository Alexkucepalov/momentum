import { Stack } from 'expo-router';

import { colors, type } from '@/src/theme/tokens';

export default function RecipesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '800', fontSize: type.title },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Рецепты' }} />
      <Stack.Screen name="new" options={{ title: 'Новый рецепт' }} />
      <Stack.Screen name="import-text" options={{ title: 'Из текста' }} />
      <Stack.Screen name="import-personal" options={{ title: 'Мой архив' }} />
      <Stack.Screen name="[id]" options={{ title: 'Рецепт' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Редактировать' }} />
    </Stack>
  );
}
