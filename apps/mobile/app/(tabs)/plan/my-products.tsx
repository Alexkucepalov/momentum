import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

import {
  parseProductListText,
  type ParsedProductListItem,
} from '../../../../../src/domain/parseProductListText';
import type { FoodProduct } from '../../../../../src/storage/types';
import { EmptyState } from '@/src/components/EmptyState';
import { FormScrollView } from '@/src/components/FormScrollView';
import { MacroStrip } from '@/src/components/MacroStrip';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAddGuard } from '@/src/hooks/useAddGuard';
import { useData } from '@/src/state/DataContext';
import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';
import { alertMessage } from '@/src/utils/confirmAction';

export default function MyProductsScreen() {
  const { repo, refresh, revision, showFlash } = useData();
  void revision;
  const allowAdd = useAddGuard();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<FoodProduct | null>(null);
  const [editName, setEditName] = useState('');
  const [editKcal, setEditKcal] = useState('');
  const [editP, setEditP] = useState('');
  const [editF, setEditF] = useState('');
  const [editC, setEditC] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = (p: FoodProduct) => {
    setEditing(p);
    setEditName(p.name);
    setEditKcal(p.energyKcal == null ? '' : String(p.energyKcal));
    setEditP(p.proteinG == null ? '' : String(p.proteinG));
    setEditF(p.fatG == null ? '' : String(p.fatG));
    setEditC(p.carbG == null ? '' : String(p.carbG));
    setEditError(null);
  };

  const parseOptional = (raw: string): number | null => {
    const t = raw.trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) throw new Error('КБЖУ: число ≥ 0 или пусто');
    return n;
  };

  const saveEdit = () => {
    if (!editing) return;
    try {
      const name = editName.trim();
      if (!name) throw new Error('Нужно название');
      repo.updateProduct(editing.id, {
        name,
        energyKcal: parseOptional(editKcal),
        proteinG: parseOptional(editP),
        fatG: parseOptional(editF),
        carbG: parseOptional(editC),
      });
      setEditing(null);
      refresh();
      showFlash('Сохранено');
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Не удалось сохранить');
    }
  };

  const mine = useMemo(
    () =>
      repo
        .listProducts()
        .filter((p) => p.source === 'user' || p.isFavorite)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [repo, revision],
  );

  const preview = useMemo(() => {
    const t = raw.trim();
    if (!t) return null;
    return parseProductListText(t);
  }, [raw]);

  const pasteFromClipboard = async () => {
    try {
      const t = (await Clipboard.getStringAsync()).trim();
      if (!t) {
        alertMessage('Буфер пуст', 'Скопируй список названий и нажми снова.');
        return;
      }
      setRaw(t);
      setError(null);
      setImportOpen(true);
    } catch {
      alertMessage('Буфер', 'Не удалось прочитать — вставь текст вручную.');
    }
  };

  const confirmImport = () => {
    if (!allowAdd()) return;
    const t = raw.trim();
    if (!t) {
      setError('Вставь список продуктов');
      return;
    }
    const parsed = parseProductListText(t);
    if (parsed.items.length === 0) {
      setError('Не удалось найти названия — по одной строке на продукт');
      return;
    }

    const existing = new Set(
      repo.listProducts().map((p) => p.name.trim().toLocaleLowerCase('ru')),
    );
    let created = 0;
    let skipped = 0;
    for (const item of parsed.items) {
      const key = item.name.trim().toLocaleLowerCase('ru');
      if (existing.has(key)) {
        skipped += 1;
        continue;
      }
      repo.createProduct({
        name: item.name.trim(),
        energyKcal: item.energyKcal,
        proteinG: item.proteinG,
        fatG: item.fatG,
        carbG: item.carbG,
        source: 'user',
      });
      existing.add(key);
      created += 1;
    }

    setError(null);
    setRaw('');
    setImportOpen(false);
    refresh();
    const skipNote = skipped > 0 ? ` · пропущено дублей: ${skipped}` : '';
    showFlash(`В каталог: ${created}${skipNote}`);
  };

  return (
    <FormScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        База того, что обычно покупаете. Вставьте список названий — без выдуманных ккал.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            setImportOpen((v) => !v);
            setError(null);
          }}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={importOpen ? 'Скрыть импорт' : 'Добавить списком'}
        >
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.actionText}>{importOpen ? 'Скрыть импорт' : 'Добавить списком'}</Text>
        </Pressable>
        <Pressable
          onPress={() => void pasteFromClipboard()}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Вставить из буфера"
        >
          <Ionicons name="clipboard-outline" size={18} color={colors.text} />
          <Text style={styles.actionText}>Из буфера</Text>
        </Pressable>
      </View>

      {importOpen ? (
        <View style={styles.importBox}>
          <Text style={styles.steps}>1. Вставь · 2. Проверь · 3. В каталог</Text>
          <TextInput
            value={raw}
            onChangeText={(t) => {
              setRaw(t);
              setError(null);
            }}
            multiline
            autoCapitalize="sentences"
            placeholder={`Пример:\nТворог 5%\nКуриная грудка\nОвсянка\nГреческий йогурт — 59 ккал /100г · Б 10 · Ж 0.4 · У 3.6`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            textAlignVertical="top"
            accessibilityLabel="Список продуктов"
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {preview && preview.items.length > 0 ? (
            <View style={styles.preview} accessibilityRole="list">
              <Text style={styles.previewTitle}>Предпросмотр · {preview.items.length}</Text>
              {preview.items.map((item) => (
                <PreviewRow key={item.name} item={item} />
              ))}
              {preview.warnings.length > 0 ? (
                <Text style={styles.warn}>{preview.warnings.slice(0, 3).join(' · ')}</Text>
              ) : null}
            </View>
          ) : null}
          <PrimaryButton
            label="Добавить в каталог"
            onPress={confirmImport}
            disabled={!preview || preview.items.length === 0}
          />
        </View>
      ) : null}

      <Text style={styles.section}>В каталоге · {mine.length}</Text>
      {mine.length === 0 ? (
        <EmptyState
          compact
          icon="basket-outline"
          title="Пока пусто"
          body="Добавьте списком то, что покупаете регулярно — потом быстро в дневник и Eat Now."
          actionLabel="Добавить списком"
          onAction={() => setImportOpen(true)}
        />
      ) : (
        <View style={styles.list} accessibilityRole="list">
          {mine.map((p) => {
            const unknown =
              p.energyKcal == null && p.proteinG == null && p.fatG == null && p.carbG == null;
            return (
              <View
                key={p.id}
                style={styles.card}
                accessibilityRole="summary"
                accessibilityLabel={p.name}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Pressable
                    onPress={() => {
                      repo.setFavorite(p.id, !p.isFavorite);
                      refresh();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={p.isFavorite ? `Убрать из избранного ${p.name}` : `В избранное ${p.name}`}
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name={p.isFavorite ? 'star' : 'star-outline'}
                      size={20}
                      color={p.isFavorite ? colors.fat : colors.textMuted}
                    />
                  </Pressable>
                </View>
                {unknown ? (
                  <Text style={styles.warn}>КБЖУ неизвестны — Eat Now пропустит, пока не допишете</Text>
                ) : (
                  <MacroStrip
                    energyKcal={p.energyKcal}
                    proteinG={p.proteinG}
                    fatG={p.fatG}
                    carbG={p.carbG}
                  />
                )}
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => openEdit(p)}
                    style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Изменить ${p.name}`}
                  >
                    <Text style={styles.actionText}>Изменить</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      repo.softDeleteProduct(p.id);
                      refresh();
                      showFlash(`Удалено: ${p.name}`);
                    }}
                    style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Удалить ${p.name}`}
                  >
                    <Text style={[styles.actionText, styles.dangerText]}>Удалить</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {editing ? (
            <View style={styles.importBox}>
              <Text style={styles.steps}>Правка · пустые КБЖУ = неизвестно</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Название"
                placeholderTextColor={colors.textMuted}
                style={styles.field}
                accessibilityLabel="Название продукта"
              />
              <View style={styles.macroRow}>
                <TextInput
                  value={editKcal}
                  onChangeText={setEditKcal}
                  placeholder="ккал"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                  style={styles.field}
                  accessibilityLabel="Килокалории на 100 г"
                />
                <TextInput
                  value={editP}
                  onChangeText={setEditP}
                  placeholder="Б"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                  style={styles.field}
                  accessibilityLabel="Белки на 100 г"
                />
                <TextInput
                  value={editF}
                  onChangeText={setEditF}
                  placeholder="Ж"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                  style={styles.field}
                  accessibilityLabel="Жиры на 100 г"
                />
                <TextInput
                  value={editC}
                  onChangeText={setEditC}
                  placeholder="У"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                  style={styles.field}
                  accessibilityLabel="Углеводы на 100 г"
                />
              </View>
              {editError ? <Text style={styles.error}>{editError}</Text> : null}
              <PrimaryButton label="Сохранить" onPress={saveEdit} />
              <Pressable
                onPress={() => setEditing(null)}
                accessibilityRole="button"
                accessibilityLabel="Отменить правку"
              >
                <Text style={styles.previewMeta}>Отмена</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
    </FormScrollView>
  );
}

function PreviewRow({ item }: { item: ParsedProductListItem }) {
  const hasMacro =
    item.energyKcal != null ||
    item.proteinG != null ||
    item.fatG != null ||
    item.carbG != null;
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewName}>{item.name}</Text>
      <Text style={styles.previewMeta}>
        {hasMacro ? 'КБЖУ из текста /100г' : 'КБЖУ неизвестны — ок'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionBtn: {
    minHeight: touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionText: { fontSize: type.caption, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.88 },
  importBox: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  steps: { fontSize: type.caption, fontWeight: '700', color: colors.textSecondary },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: type.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: { fontSize: type.caption, color: colors.danger, fontWeight: '600' },
  preview: { gap: 6 },
  previewTitle: { fontSize: type.caption, fontWeight: '800', color: colors.text },
  previewRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  previewName: { fontSize: type.body, fontWeight: '600', color: colors.text },
  previewMeta: { fontSize: type.caption, color: colors.textMuted },
  warn: { fontSize: type.caption, color: colors.textSecondary },
  section: {
    marginTop: space.sm,
    fontSize: type.micro,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: { gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 6,
  },
  cardTitle: { flex: 1, fontSize: type.subtitle, fontWeight: '700', color: colors.text },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconBtn: { minWidth: touchMin, minHeight: touchMin, alignItems: 'center', justifyContent: 'center' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 4 },
  dangerText: { color: colors.danger },
  field: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.sm,
    fontSize: type.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  macroRow: { flexDirection: 'row', gap: space.sm },
});
