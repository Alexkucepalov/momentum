import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';
import { colors, radius, space } from '../theme/tokens';

/**
 * Centered dialog that slides up above the keyboard so the focused field stays visible.
 */
export function CenteredFormModal({
  visible,
  onClose,
  children,
  cardStyle,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const keyboardInset = useKeyboardBottomInset();
  const keyboardOpen = keyboardInset > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
      statusBarTranslucent
    >
      <View
        style={[
          styles.backdrop,
          keyboardOpen && {
            justifyContent: 'flex-end',
            paddingBottom: keyboardInset + space.md,
          },
        ]}
        testID={testID}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />
        <View style={[styles.card, cardStyle]}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
  },
});
