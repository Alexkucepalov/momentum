import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText, colors, space } from "@/src/design-system";

/** Local media only. A JSON import must not silently fetch arbitrary remote image URLs. */
export function RecipeImage({
  uri,
  style,
  label = "Фото рецепта",
  compact = false,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
  label?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const local = /^(file:|content:|blob:|data:image\/)/i.test(uri);
  return (
    <View style={[styles.frame, style]}>
      {local && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={label}
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={styles.fallback}
          accessibilityRole="image"
          accessibilityLabel="Фото недоступно"
        >
          <Ionicons
            name="image-outline"
            size={compact ? 20 : 28}
            color={colors.textSecondary}
          />
          {!compact ? (
            <AppText variant="caption" tone="secondary">
              Фото недоступно на этом устройстве
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    padding: space.sm,
  },
});
