import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, colors, space, touchMin } from '@/src/design-system';
import { SwipeToDismissSheet } from './SwipeToDismissSheet';

export type MenuAction = { id: string; label: string; detail?: string; destructive?: boolean; onPress: () => void };

/** Scrollable actions avoid Android Alert's three-button limit and work on web. */
export function ActionMenuSheet({ visible, title, description, actions, onClose }: {
  visible: boolean; title: string; description?: string; actions: MenuAction[]; onClose: () => void;
}) {
  return <SwipeToDismissSheet visible={visible} onClose={onClose} maxHeightRatio={0.85} testID="action-menu-sheet">
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.head}><AppText variant="subtitle" style={styles.title}>{title}</AppText><Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть меню" style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
      {description ? <AppText variant="caption" tone="secondary">{description}</AppText> : null}
      {actions.map(action => <Pressable key={action.id} accessibilityRole="button" accessibilityLabel={action.label} testID={`menu-action-${action.id}`} onPress={() => { onClose(); action.onPress(); }} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.copy}><AppText variant="body" tone={action.destructive ? 'danger' : 'ink'}>{action.label}</AppText>{action.detail ? <AppText variant="caption" tone="secondary">{action.detail}</AppText> : null}</View>
        <Ionicons name="chevron-forward" size={16} color={action.destructive ? colors.danger : colors.textMuted} />
      </Pressable>)}
    </ScrollView>
  </SwipeToDismissSheet>;
}
const styles = StyleSheet.create({
  content: { padding: space.screen, gap: space.sm }, head: { flexDirection: 'row', alignItems: 'center', gap: space.sm }, title: { flex: 1 },
  close: { width: touchMin, height: touchMin, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: space.xs },
  row: { minHeight: touchMin, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, pressed: { opacity: 0.65 },
});
