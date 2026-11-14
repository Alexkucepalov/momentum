import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppText, colors, space } from '@/src/design-system';

export default function NotFoundScreen() {
  const router = useRouter();
  return <>
    <Stack.Screen options={{ title: 'Страница не найдена' }} />
    <View style={styles.container}>
      <Ionicons name="compass-outline" size={40} color={colors.textMuted} />
      <AppText variant="title" style={styles.center}>Здесь пока ничего нет</AppText>
      <AppText tone="secondary" style={styles.center}>Возможно, эта ссылка устарела. Вернись на главный экран, чтобы продолжить.</AppText>
      <AppButton label="На экран «Сегодня»" onPress={() => router.replace('/')} />
    </View>
  </>;
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg, padding: space.screen, backgroundColor: colors.canvas },
  center: { textAlign: 'center' },
});
