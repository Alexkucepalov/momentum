import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { parseProductListText, type ParsedProductDraft } from '../../../../src/domain/parseProductListText';
import { FormScrollView } from '@/src/components/FormScrollView';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { EmptyState } from '@/src/components/EmptyState';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type Step = 'input' | 'review';

type ReviewProduct = ParsedProductDraft & {
  key: string;
  energyKcal: string;
  proteinG: string;
  fatG: string;
  carbG: string;
  excluded: boolean;
};

function toReviewProducts(drafts: ParsedProductDraft[]): ReviewProduct[] {
  return drafts.map((d, i) => ({
    ...d,
    key: `p-${i}-${d.displayName}`,
    energyKcal: '',
    proteinG: '',
    fatG: '',
    carbG: '',
    excluded: false,
  }));
}

/**
 * My products: paste list of names → review → createProduct.
 * Macros null unless user fills; no invented kcal.
 */
export default function MyProductsScreen() {
  const router = useRouter();
  const { repo, refresh, showFlash } = useData();

  const [step, setStep] = useState<Step>('input');
  const [pasteText, setPasteText] = useState('');
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const goReview = () => {
    setError(null);
    const parsed = parseProductListText(pasteText);
    
    if (parsed.products.length === 0) {
      setError(parsed.warnings[0] ?? 'Нет продуктов для добавления');
      return;
    }

    setProducts(toReviewProducts(parsed.products));
    setWarnings(parsed.warnings);
    setStep('review');
  };

  const confirmProducts = () => {
    setError(null);
    try {
      const toAdd = products.filter(p => !p.excluded);
      if (toAdd.length === 0) {
        throw new Error('Все продукты исключены — нечего добавлять');
      }

      let added = 0;
      for (const p of toAdd) {
        const energyKcal = p.energyKcal.trim() ? Number(p.energyKcal.replace(',', '.')) : null;
        const proteinG = p.proteinG.trim() ? Number(p.proteinG.replace(',', '.')) : null;
        const fatG = p.fatG.trim() ? Number(p.fatG.replace(',', '.')) : null;
        const carbG = p.carbG.trim() ? Number(p.carbG.replace(',', '.')) : null;

        // Validate numbers if provided
        if (energyKcal !== null && (!Number.isFinite(energyKcal) || energyKcal < 0)) {
          throw new Error(`Калории для «${p.displayName}»: число ≥ 0 или пусто`);
        }
        if (proteinG !== null && (!Number.isFinite(proteinG) || proteinG < 0)) {
          throw new Error(`Белки для «${p.displayName}»: число ≥ 0 или пусто`);
        }
        if (fatG !== null && (!Number.isFinite(fatG) || fatG < 0)) {
          throw new Error(`Жиры для «${p.displayName}»: число ≥ 0 или пусто`);
        }
        if (carbG !== null && (!Number.isFinite(carbG) || carbG < 0)) {
          throw new Error(`Углеводы для «${p.displayName}»: число ≥ 0 или пусто`);
        }

        // Check if product already exists
        const existing = repo.listProducts().find(
          prod => prod.name.toLowerCase() === p.displayName.toLowerCase() && !prod.deletedAt
        );

        if (existing) {
          // Update existing product's nutrition if any new values provided
          if (energyKcal !== null || proteinG !== null || fatG !== null || carbG !== null) {
            repo.updateProductNutrition(existing.id, {
              energyKcal: energyKcal ?? existing.energyKcal,
              proteinG: proteinG ?? existing.proteinG,
              fatG: fatG ?? existing.fatG,
              carbG: carbG ?? existing.carbG,
            });
          }
        } else {
          // Create new product with macros null unless user filled
          repo.createProduct({
            name: p.displayName,
            energyKcal,
            proteinG,
            fatG,
            carbG,
          });
          added++;
        }
      }

      refresh();
      showFlash(added > 0 ? `В каталог: ${added} продуктов` : 'Продукты обновлены');
      
      // Reset and go back to input
      setPasteText('');
      setProducts([]);
      setWarnings([]);
      setStep('input');
      
      // Navigate to Food catalog to show added products
      router.push('/(tabs)/food');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить продукты');
    }
  };

  if (step === 'review') {
    const activeCount = products.filter(p => !p.excluded).length;
    
    return (
      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Проверь названия. КБЖУ на 100 г — заполни если знаешь, иначе пусто (не угадываем).
        </Text>

        {warnings.map((w, i) => (
          <Text key={i} style={styles.warn}>{w}</Text>
        ))}

        <ScrollView style={styles.productsList} contentContainerStyle={styles.productsContent}>
          {products.map((p, i) => (
            <View key={p.key} style={[styles.card, p.excluded && styles.cardExcluded]}>
              <View style={styles.cardHeader}>
                <Text style={styles.fieldLabel}>Название</Text>
                <Pressable
                  onPress={() => {
                    setProducts(prev =>
                      prev.map((prod, j) =>
                        j === i ? { ...prod, excluded: !prod.excluded } : prod
                      )
                    );
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: p.excluded }}
                  accessibilityLabel={`Исключить ${p.displayName}`}
                >
                  <Text style={styles.excludeBtn}>{p.excluded ? 'Вернуть' : 'Исключить'}</Text>
                </Pressable>
              </View>
              
              <TextInput
                value={p.displayName}
                onChangeText={(t) =>
                  setProducts(prev =>
                    prev.map((prod, j) => (j === i ? { ...prod, displayName: t } : prod))
                  )
                }
                style={styles.input}
                accessibilityLabel={`Название продукта ${i + 1}`}
              />

              <Text style={styles.fieldLabel}>КБЖУ на 100 г (пусто = неизвестно)</Text>
              
              <View style={styles.macroRow}>
                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>ккал</Text>
                  <TextInput
                    value={p.energyKcal}
                    onChangeText={(t) =>
                      setProducts(prev =>
                        prev.map((prod, j) => (j === i ? { ...prod, energyKcal: t } : prod))
                      )
                    }
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.macroInput}
                    accessibilityLabel={`Калории ${p.displayName}`}
                  />
                </View>

                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>Б</Text>
                  <TextInput
                    value={p.proteinG}
                    onChangeText={(t) =>
                      setProducts(prev =>
                        prev.map((prod, j) => (j === i ? { ...prod, proteinG: t } : prod))
                      )
                    }
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.macroInput}
                    accessibilityLabel={`Белки ${p.displayName}`}
                  />
                </View>

                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>Ж</Text>
                  <TextInput
                    value={p.fatG}
                    onChangeText={(t) =>
                      setProducts(prev =>
                        prev.map((prod, j) => (j === i ? { ...prod, fatG: t } : prod))
                      )
                    }
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.macroInput}
                    accessibilityLabel={`Жиры ${p.displayName}`}
                  />
                </View>

                <View style={styles.macroField}>
                  <Text style={styles.macroLabel}>У</Text>
                  <TextInput
                    value={p.carbG}
                    onChangeText={(t) =>
                      setProducts(prev =>
                        prev.map((prod, j) => (j === i ? { ...prod, carbG: t } : prod))
                      )
                    }
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.macroInput}
                    accessibilityLabel={`Углеводы ${p.displayName}`}
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.summary} accessibilityRole="summary">
          В каталог: {activeCount} из {products.length}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <PrimaryButton label="Добавить в каталог" onPress={confirmProducts} />
        
        <Pressable
          onPress={() => {
            setStep('input');
            setProducts([]);
            setWarnings([]);
          }}
          accessibilityRole="button"
          accessibilityLabel="Назад к вводу"
        >
          <Text style={styles.back}>← Изменить список</Text>
        </Pressable>
      </FormScrollView>
    );
  }

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Вставь список названий (по строке). КБЖУ заполнишь на следующем шаге — только если знаешь.
        Угадывать калории не будем.
      </Text>

      <TextInput
        value={pasteText}
        onChangeText={setPasteText}
        placeholder={'Молоко 2.5%\nХлеб белый\nТворог 5%\nЯйца С0'}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.pasteInput]}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Список продуктов"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="К проверке" onPress={goReview} />

      <Text style={styles.hint}>
        Можно вставить список из заметок, доставки или магазина. Цены и скобки уберутся
        автоматически.
      </Text>

      <EmptyState
        compact
        icon="basket-outline"
        title="Свои продукты"
        body="Добавляй то, что часто покупаешь — потом быстрее найдёшь в дневнике. Без КБЖУ тоже можно, просто запишется название."
      />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  lead: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  input: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    fontSize: type.body,
    color: colors.text,
  },
  pasteInput: {
    minHeight: 180,
    paddingVertical: space.md,
  },
  productsList: {
    maxHeight: 400,
  },
  productsContent: {
    gap: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  cardExcluded: {
    opacity: 0.5,
    borderColor: colors.textMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  excludeBtn: {
    fontSize: type.caption,
    fontWeight: '700',
    color: colors.accent,
  },
  macroRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  macroField: {
    flex: 1,
    gap: 4,
  },
  macroLabel: {
    fontSize: type.micro,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  macroInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    backgroundColor: colors.background,
    fontSize: type.body,
    color: colors.text,
    textAlign: 'center',
  },
  warn: {
    fontSize: type.caption,
    color: colors.textMuted,
  },
  error: {
    color: colors.danger,
    fontSize: type.caption,
  },
  summary: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.text,
  },
  back: {
    fontSize: type.body,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
