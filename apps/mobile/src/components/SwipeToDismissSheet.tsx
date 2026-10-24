import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';
import { colors, radius, space } from '../theme/tokens';

const DISMISS_DY = 96;
const DISMISS_VY = 0.85;

/**
 * Bottom sheet with drag-handle swipe-down (and backdrop tap) to close.
 * Pan is attached only to the handle so ScrollViews inside stay usable.
 * Lifts above the soft keyboard so macro fields stay visible while typing.
 */
export function SwipeToDismissSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.92,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeightRatio?: number;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const translateY = useRef(new Animated.Value(0)).current;
  const screenH = Dimensions.get('window').height;
  const availableH = Math.max(240, screenH - keyboardInset);

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 4,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > DISMISS_DY || g.vy > DISMISS_VY) {
            Animated.timing(translateY, {
              toValue: screenH,
              duration: 180,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) {
                translateY.setValue(0);
                onClose();
              }
            });
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 3,
          }).start();
        },
      }),
    [onClose, screenH, translateY],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
      statusBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрыть"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: availableH * maxHeightRatio,
              marginBottom: keyboardInset,
              paddingBottom: Math.max(insets.bottom, space.lg),
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={styles.handleHit}
            {...pan.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Потяните вниз, чтобы закрыть"
          >
            <View style={styles.handle} />
          </View>
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayScrim,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  handleHit: {
    alignItems: 'center',
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  content: {
    flexShrink: 1,
  },
});
