import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, colors, radius, space } from '@/src/design-system';
import { useData } from '../state/DataContext';

const SHOW_MS = 2800;

function flashIcon(message: string): keyof typeof Ionicons.glyphMap {
  const m = message.toLowerCase();
  if (m.includes('удал') || m.includes('очищ') || m.includes('снят')) return 'trash-outline';
  if (m.includes('ошиб') || m.includes('не ') || m.includes('пуст')) return 'alert-circle-outline';
  if (m.includes('скопир') || m.includes('буфер') || m.includes('отчёт')) return 'copy-outline';
  if (m.includes('восстанов') || m.includes('импорт')) return 'download-outline';
  return 'checkmark-circle';
}

/** Non-destructive toast (save / copy). Sits above the tab bar. */
export function FlashBar({ bottomOffset = 56 }: { bottomOffset?: number }) {
  const { flash, flashId, clearFlash, undo } = useData();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!flash) return;

    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const hide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 160, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) clearFlash();
      });
    }, SHOW_MS);

    return () => { clearTimeout(hide); opacity.stopAnimation(); translateY.stopAnimation(); };
  }, [flash, flashId, clearFlash, opacity, translateY]);

  if (!flash || undo) return null;

  const icon = flashIcon(flash);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.anchor,
        {
          bottom: Math.max(insets.bottom, space.sm) + bottomOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={clearFlash}
        accessibilityRole="button"
        accessibilityLabel={flash}
        accessibilityLiveRegion="polite"
        style={({ pressed }) => [styles.toast, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={colors.onAccent} />
        </View>
        <AppText variant="body" tone="inverse" style={styles.message} numberOfLines={3}>
          {flash}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    zIndex: 30,
    alignItems: 'center',
  },
  toast: {
    maxWidth: 420,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 20,
  },
  pressed: { opacity: 0.92 },
});
