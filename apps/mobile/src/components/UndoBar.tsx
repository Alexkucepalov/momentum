import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText as Text } from "@/src/design-system/components/ThemedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, space, type } from "../theme/tokens";
import { useData } from "../state/DataContext";

/** Approx tab bar content height (icons+label) above system inset. */


export function UndoBar({ bottomOffset = 56 }: { bottomOffset?: number }) {
  const { undo, performUndo, setUndo } = useData();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!undo) return;
    setReady(false);
    // A second food tap must not activate a toast button appearing under the finger.
    const arm = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(arm);
  }, [undo, setUndo]);

  if (!undo) return null;

  const bottom = bottomOffset + Math.max(insets.bottom, space.sm);

  return (
    <View
      style={[styles.wrap, { bottom }]}
      accessibilityLiveRegion="polite"
      testID="diary-undo"
    >
      <Text style={styles.message} numberOfLines={3}>
        {undo.message}
      </Text>
      <Pressable
        disabled={!ready}
        onPress={performUndo}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel="Отменить"
        hitSlop={8}
      >
        <Text style={styles.btnText}>Отменить</Text>
      </Pressable>
      <Pressable
        disabled={!ready}
        onPress={() => setUndo(null)}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        hitSlop={8}
      >
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 48,
  },
  message: {
    flex: 1,
    color: colors.primaryButtonText,
    fontSize: type.caption,
    fontWeight: "600",
  },
  btn: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  btnText: {
    color: colors.primaryButtonText,
    fontWeight: "800",
    fontSize: type.caption,
  },
  dismiss: {
    minHeight: 48,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xs,
  },
  dismissText: {
    color: colors.textMuted,
    fontSize: type.body,
  },
});
