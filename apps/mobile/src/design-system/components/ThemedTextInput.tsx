import { forwardRef } from "react";
import { TextInput, StyleSheet, type TextInputProps } from "react-native";
import { fonts } from "../tokens";

export type ThemedTextInput = TextInput;

/** One offline font family for legacy fields as well as Field; native input/ref APIs stay intact. */
export const ThemedTextInput = forwardRef<TextInput, TextInputProps>(
  function ThemedTextInput({ style, ...props }, ref) {
    const flat = StyleSheet.flatten(style);
    const weight =
      flat?.fontWeight === "bold" ? 700 : Number(flat?.fontWeight ?? 400);
    const family =
      weight >= 600
        ? fonts.semibold
        : weight >= 500
          ? fonts.medium
          : fonts.regular;
    return (
      <TextInput
        {...props}
        ref={ref}
        style={[
          style,
          !flat?.fontFamily && { fontFamily: family, fontWeight: "normal" },
        ]}
      />
    );
  },
);
