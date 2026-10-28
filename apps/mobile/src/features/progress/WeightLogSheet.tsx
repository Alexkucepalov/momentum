import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, touchMin, type } from '@/src/theme/tokens';

type WeightRow = { id: string; kg: number; weighedAt: string };

/** Ref 02 — dark focused weight log sheet. */
export function WeightLogSheet({
  visible,
  onClose,
  recent,
  onLog,
}: {
  visible: boolean;
  onClose: () => void;
  recent: WeightRow[];
  onLog: (kg: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState('');

  const preview = useMemo(() => {
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [raw]);

  const submit = () => {
    if (preview == null) return;
    onLog(preview);
    setRaw('');
  };

  return (
    <Modal visible={visible} animationType="slide" accessibilityViewIsModal onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.head}>
          <Pressable
            onPress={onClose}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          >
            <Ionicons name="chevron-down" size={22} color={colors.darkText} />
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={preview == null}
            style={[styles.logPill, preview == null && styles.logPillOff]}
            accessibilityRole="button"
            accessibilityLabel="Сохранить вес"
          >
            <Text style={styles.logPillText}>Записать</Text>
          </Pressable>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Вес
        </Text>
        <Text style={styles.sub}>Новая запись</Text>

        <Text style={styles.fieldLabel}>Килограммы</Text>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          keyboardType="decimal-pad"
          placeholder="например 77.9"
          placeholderTextColor={colors.darkTextMuted}
          style={styles.input}
          accessibilityLabel="Вес в килограммах"
          autoFocus
        />
        {preview != null ? (
          <Text style={styles.heroPreview} accessibilityLiveRegion="polite">
            {preview}
            <Text style={styles.heroUnit}> кг</Text>
          </Text>
        ) : (
          <Text style={styles.heroMuted}>—</Text>
        )}

        <Text style={styles.recentTitle}>Недавние</Text>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {recent.length === 0 ? (
            <Text style={styles.empty}>Пока нет записей</Text>
          ) : (
            recent.slice(0, 8).map((w) => (
              <View key={w.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="sunny-outline" size={18} color={colors.darkText} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowKg}>{w.kg} кг</Text>
                  <Text style={styles.rowMeta}>
                    {new Date(w.weighedAt).toLocaleString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.darkTextMuted} />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.darkBg,
    paddingHorizontal: space.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logPill: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.darkText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logPillOff: { opacity: 0.35 },
  logPillText: {
    fontSize: type.body,
    fontWeight: '800',
    color: colors.darkBg,
  },
  title: {
    fontSize: type.title,
    fontWeight: '800',
    color: colors.darkText,
  },
  sub: {
    marginTop: 4,
    marginBottom: space.xl,
    fontSize: type.body,
    color: colors.darkTextSecondary,
  },
  fieldLabel: {
    fontSize: type.caption,
    color: colors.darkTextSecondary,
    marginBottom: space.sm,
  },
  input: {
    minHeight: touchMin,
    borderRadius: radius.lg,
    backgroundColor: colors.darkSurface,
    paddingHorizontal: space.lg,
    color: colors.darkText,
    fontSize: type.body,
    marginBottom: space.md,
  },
  heroPreview: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.darkText,
    letterSpacing: -1.5,
    marginBottom: space.xl,
  },
  heroUnit: {
    fontSize: type.title,
    fontWeight: '600',
    color: colors.darkTextSecondary,
  },
  heroMuted: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.darkTextMuted,
    marginBottom: space.xl,
  },
  recentTitle: {
    fontSize: type.subtitle,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: space.md,
  },
  list: { flex: 1 },
  empty: { color: colors.darkTextMuted, fontSize: type.caption },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.sm,
    minHeight: touchMin,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.darkSurfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowKg: { fontSize: type.body, fontWeight: '800', color: colors.darkText },
  rowMeta: { fontSize: type.caption, color: colors.darkTextSecondary, marginTop: 2 },
});
