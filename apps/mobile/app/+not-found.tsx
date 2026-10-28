import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, space, type } from '@/src/theme/tokens';
import { AppCard } from '@/src/ui/AppCard';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'Не найдено' }} />
      <View style={styles.container}>
        <AppCard padding="lg" style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Экран не найден
          </Text>
          <Text style={styles.body}>Вернитесь на Сегодня — данные на устройстве на месте.</Text>
          <PrimaryButton label="На Сегодня" onPress={() => router.replace('/')} />
        </AppCard>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.background,
  },
  card: { width: '100%', maxWidth: 400, gap: space.md },
  title: { fontSize: type.title, fontWeight: '800', color: colors.text },
  body: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
});
