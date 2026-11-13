import { forwardRef } from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';

import { fonts } from '../tokens';

/**
 * Apply the same bundled typefaces to legacy text and new primitives.
 * Explicit families (e.g. a JSON monospace preview) are preserved. Named font
 * instances avoid Android synthesizing the old 800-weight dashboard typography.
 */
export const ThemedText = forwardRef<Text, TextProps>(function ThemedText(
  { style, ...props }, ref,
) {
  const flat = StyleSheet.flatten(style);
  const customFamily = flat?.fontFamily;
  const weight = flat?.fontWeight;
  const numericWeight = weight === 'bold' ? 700 : Number(weight ?? 400);
  const family = numericWeight >= 600 ? fonts.semibold : numericWeight >= 500 ? fonts.medium : fonts.regular;
  return (
    <Text
      {...props}
      ref={ref}
      style={[style, !customFamily && { fontFamily: family, fontWeight: 'normal' }]}
    />
  );
});
