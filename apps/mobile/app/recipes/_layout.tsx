import { Stack } from 'expo-router';

import { colors, fonts, type } from '@/src/theme/tokens';

export default function RecipesLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Рецепты' }} />
      <Stack.Screen name="new" options={{ title: 'Новый рецепт' }} />
      <Stack.Screen name="import-text" options={{ title: 'Из текста' }} />
      <Stack.Screen name="import-personal" options={{ title: 'Мой архив' }} />
      <Stack.Screen name="[id]" options={{ title: 'Рецепт' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Редактировать' }} />
    </Stack>
  );
}
