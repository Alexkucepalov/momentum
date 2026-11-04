import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import {
  importSelectedPersonalRecipes,
  listPersonalRecipePreviews,
} from '@/src/features/recipes/personalRecipesPack';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { alertMessage } from '@/src/utils/confirmAction';
import { AppButton } from '@/src/design-system';

type Scope = 'suggested' | 'all' | 'prepared';

function statusLabel(status: string, verified: boolean): string {
  if (verified) return 'Проверен тобой';
  if (status === 'user_prepared') return 'Готовил';
  if (status === 'discussed' || status === 'discussed_unconfirmed') return 'Обсуждали';
  if (status.startsWith('assistant')) return 'Идея ассистента';
  return status;
}

function statusIcon(
  status: string,
  verified: boolean,
): keyof typeof Ionicons.glyphMap {
  if (verified) return 'checkmark-circle';
  if (status === 'user_prepared') return 'flame-outline';
  if (status === 'discussed' || status === 'discussed_unconfirmed') return 'chatbubble-outline';
  return 'bulb-outline';
}

export default function ImportPersonalRecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { repo, refresh, showFlash, revision } = useData();
  const previews = useMemo(() => listPersonalRecipePreviews(), []);
  const [scope, setScope] = useState<Scope>('suggested');

  const importedSet = useMemo(() => {
    void revision;
    return new Set(
      repo.listRecipes().filter((r) => r.id.startsWith('import:')).map((r) => r.id),
    );
  }, [repo, revision]);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const next = new Set<string>();
    for (const p of previews) {
      if (p.suggested && p.provisionalYieldG != null && p.knownGramCount > 0) {
        next.add(p.importKey);
      }
    }
    return next;
  });

  const visible = useMemo(() => {
    return previews.filter((p) => {
      if (scope === 'all') return true;
      if (scope === 'prepared') {
        return p.verifiedByUser || p.status === 'user_prepared';
      }
      return p.suggested;
    });
  }, [previews, scope]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const selectVisibleReady = () => {
    const n = new Set(selected);
    for (const p of visible) {
      if (p.provisionalYieldG != null && p.knownGramCount > 0) n.add(p.importKey);
    }
    setSelected(n);
  };

  const clearVisible = () => {
    const visibleKeys = new Set(visible.map((p) => p.importKey));
    setSelected((prev) => {
      const n = new Set(prev);
      for (const k of visibleKeys) n.delete(k);
      return n;
    });
  };

  const onImport = () => {
    const keys = [...selected];
    if (keys.length === 0) {
      alertMessage('Импорт', 'Отметь рецепты галочкой');
      return;
    }
    const result = importSelectedPersonalRecipes(repo, keys);
    refresh();
    const failNote =
      result.failed.length > 0 ? ` · не удалось: ${result.failed.length}` : '';
    showFlash(`В библиотеку: +${result.created}, уже были ${result.skipped}${failNote}`);
    router.replace('/recipes');
  };

  const selectedReady = [...selected].filter((k) => {
    const p = previews.find((x) => x.importKey === k);
    return p && p.provisionalYieldG != null && p.knownGramCount > 0;
  }).length;

  return (
    <View style={styles.root}>
      <FormScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="library-outline" size={28} color={colors.text} />
          </View>
          <Text style={styles.heroTitle}>Мой архив</Text>
          <Text style={styles.lead}>
            Рецепты из переписки. Выбери, что перенести в библиотеку. Без точных грамм — в
            описание, КБЖУ не выдумываем. Повторный импорт не создаёт дубликаты.
          </Text>
        </View>

        <View style={styles.scopes} accessibilityRole="tablist">
          {(
            [
              {
                id: 'suggested' as const,
                label: 'Рекоменд.',
                icon: 'sparkles-outline' as const,
              },
              {
                id: 'prepared' as const,
                label: 'Готовил',
                icon: 'flame-outline' as const,
              },
              { id: 'all' as const, label: 'Все', icon: 'apps-outline' as const },
            ]
          ).map((s) => {
            const on = scope === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setScope(s.id)}
                style={[styles.scopeChip, on && styles.scopeChipOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={s.label}
              >
                <Ionicons
                  name={s.icon}
                  size={14}
                  color={on ? colors.primaryButtonText : colors.textSecondary}
                />
                <Text style={[styles.scopeText, on && styles.scopeTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toolbarCard}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{visible.length}</Text>
              <Text style={styles.statLabel}>в списке</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{selected.size}</Text>
              <Text style={styles.statLabel}>отмечено</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{selectedReady}</Text>
              <Text style={styles.statLabel}>к импорту</Text>
            </View>
          </View>
          <View style={styles.toolbar}>
            <Pressable
              onPress={selectVisibleReady}
              style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Выбрать видимые готовые"
            >
              <Ionicons name="checkbox-outline" size={16} color={colors.text} />
              <Text style={styles.toolText}>Выбрать видимые</Text>
            </Pressable>
            <Pressable
              onPress={clearVisible}
              style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Снять видимые"
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.text} />
              <Text style={styles.toolText}>Снять</Text>
            </Pressable>
          </View>
        </View>

        {visible.length === 0 ? (
          <EmptyState
            compact
            icon="folder-open-outline"
            title="В этом фильтре пусто"
            body="Переключи вкладку выше — или открой «Все»."
            actionLabel="Показать все"
            onAction={() => setScope('all')}
          />
        ) : (
          visible.map((p) => {
            const on = selected.has(p.importKey);
            const blocked = p.provisionalYieldG == null || p.knownGramCount === 0;
            const already = importedSet.has(p.stableRecipeId);
            return (
              <Pressable
                key={p.importKey}
                onPress={() => {
                  if (blocked) {
                    alertMessage(
                      p.title,
                      'Мало известных грамм — нельзя сохранить без выдуманных масс. Добавь через «Из текста» или вручную.',
                    );
                    return;
                  }
                  toggle(p.importKey);
                }}
                style={({ pressed }) => [
                  styles.card,
                  on && styles.cardOn,
                  blocked && styles.cardBlocked,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled: blocked }}
                accessibilityLabel={`${p.title}. ${statusLabel(p.status, p.verifiedByUser)}${
                  blocked ? '. Нельзя импортировать без грамм' : ''
                }`}
              >
                <View style={styles.cardHead}>
                  <View style={[styles.checkWrap, on && styles.checkWrapOn]}>
                    <Ionicons
                      name={on ? 'checkmark' : blocked ? 'close' : 'add'}
                      size={18}
                      color={
                        blocked
                          ? colors.textMuted
                          : on
                            ? colors.primaryButtonText
                            : colors.text
                      }
                    />
                  </View>
                  <View style={styles.cardHeadText}>
                    <Text style={styles.title} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.statusBadge}>
                        <Ionicons
                          name={statusIcon(p.status, p.verifiedByUser)}
                          size={11}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.status}>
                          {statusLabel(p.status, p.verifiedByUser)}
                        </Text>
                      </View>
                      {already ? (
                        <View style={styles.alreadyBadge}>
                          <Ionicons name="checkmark-done" size={11} color={colors.success} />
                          <Text style={styles.alreadyText}>в библиотеке</Text>
                        </View>
                      ) : null}
                      {p.yieldIsProvisional ? (
                        <View style={styles.approxBadge}>
                          <Text style={styles.approxText}>выход ≈</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={styles.countsRow}>
                  <View style={styles.countChip}>
                    <Ionicons name="scale-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.counts}>
                      {p.knownGramCount}/{p.ingredientCount} с граммами
                    </Text>
                  </View>
                  {p.provisionalYieldG != null ? (
                    <View style={styles.countChip}>
                      <Ionicons name="beaker-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.counts}>~{p.provisionalYieldG} г</Text>
                    </View>
                  ) : null}
                </View>
                {p.missingQuantityCount > 0 ? (
                  <View style={styles.warnRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.warn}>
                      Без грамм: {p.missingQuantityNames.slice(0, 3).join(', ')}
                      {p.missingQuantityNames.length > 3
                        ? ` +${p.missingQuantityNames.length - 3}`
                        : ''}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </FormScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <AppButton
          label={
            selectedReady === 0
              ? 'Отметь рецепты'
              : `Добавить в библиотеку · ${selectedReady}`
          }
          onPress={onImport}
          disabled={selectedReady === 0}
          accessibilityHint={
            selectedReady === 0
              ? 'Сначала отметь рецепты с известными граммами'
              : `Импортирует ${selectedReady} рецептов с id import:`
          }
        />
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Назад к рецептам"
        >
          <Text style={styles.backText}>Назад к рецептам</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.sm, paddingBottom: 24 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginBottom: space.lg,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  heroTitle: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  lead: {
    fontSize: type.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scopes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xs },
  scopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 36,
  },
  scopeChipOn: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  scopeText: { fontWeight: '700', fontSize: type.caption, color: colors.text },
  scopeTextOn: { color: colors.primaryButtonText },
  toolbarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
    gap: space.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: type.title, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: type.micro, color: colors.textMuted, marginTop: 2 },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  toolText: { fontWeight: '700', fontSize: type.caption, color: colors.text },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: space.lg,
    marginBottom: space.md,
    gap: space.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardOn: { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accentSoft },
  cardBlocked: { opacity: 0.62 },
  cardHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  checkWrap: {
    width: touchMin - 8,
    height: touchMin - 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapOn: { backgroundColor: colors.primaryButton, borderColor: colors.primaryButton },
  cardHeadText: { flex: 1, gap: 2 },
  title: { fontWeight: '800', fontSize: type.subtitle, color: colors.text },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  status: { fontSize: type.micro, fontWeight: '700', color: colors.textSecondary },
  alreadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alreadyText: { fontSize: type.micro, fontWeight: '700', color: colors.success },
  approxBadge: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  approxText: { fontSize: type.micro, fontWeight: '700', color: colors.textMuted },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counts: { fontSize: type.caption, color: colors.textSecondary },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.sm,
  },
  warn: { flex: 1, fontSize: type.caption, color: colors.textMuted, lineHeight: 18 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.sm,
  },
  back: { minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  backText: { fontWeight: '700', color: colors.textSecondary },
  pressed: { opacity: 0.88 },
});
