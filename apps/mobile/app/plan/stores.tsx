import { StyleSheet, Text, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { createStoreCatalogAdapter } from '../../../../src/domain/storeCatalogAdapter';
import { FormScrollView } from '@/src/components/FormScrollView';
import { useData, useAnyRevision } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

const catalog = createStoreCatalogAdapter();

export default function StoresScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();
  const revision = useAnyRevision();
  void revision;
  const stores = repo.listStorePreferences();

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Это предпочтения, не живой каталог. Live-цены:{' '}
        {catalog.supportsLivePrices ? 'вкл.' : 'выкл.'}. Актуальные цены — только из разрешённых
        источников. Сейчас — ваши цены в покупках и ручной чек.
      </Text>
      <Pressable
        onPress={() => router.push('/plan/receipt')}
        style={({ pressed }) => [styles.receipt, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Импорт покупки"
      >
        <Text style={styles.receiptTitle}>Импорт покупки</Text>
        <Text style={styles.receiptSub}>
          Текст заказа или строки → проверка → запасы и расход. Без OCR и угадываний
        </Text>
      </Pressable>
      <View style={styles.list}>
        {stores.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => {
              repo.setStorePreferenceSelected(s.storeId, !s.selected);
              refresh();
              showFlash(s.selected ? `Снято: ${s.label}` : `Выбрано: ${s.label}`);
            }}
            style={[styles.card, s.selected && styles.cardOn]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: s.selected }}
            accessibilityLabel={s.label}
          >
            <Text style={styles.mark}>{s.selected ? '✓' : '○'}</Text>
            <Text style={styles.title}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  lead: { fontSize: type.body, color: colors.textSecondary, lineHeight: 22 },
  receipt: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  receiptTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  receiptSub: { fontSize: type.caption, color: colors.textSecondary },
  pressed: { opacity: 0.9 },
  list: { gap: space.sm },
  card: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  mark: { fontSize: 20, fontWeight: '800', color: colors.text, width: 28 },
  title: { fontSize: type.subtitle, fontWeight: '700', color: colors.text },
});
