import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  nothing,
  nothingRadius,
  nothingSpace,
  nothingType,
} from '@/src/theme/nothing';
import { touchMin } from '@/src/theme/tokens';
import { GlyphDots } from './GlyphDots';

export function NothingScreen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function NothingKicker({ label, dots = 4 }: { label: string; dots?: number }) {
  return (
    <View style={styles.kickerRow}>
      <GlyphDots count={dots} active={Math.min(2, dots)} />
      <Text style={styles.kicker}>{label}</Text>
    </View>
  );
}

export function NothingPanel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function NothingPrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function NothingOutlineButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.outline, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

export function NothingSegment({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[styles.segItem, on && styles.segOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
          >
            <Text style={[styles.segText, on && styles.segTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: nothing.bg },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nothingSpace.sm,
    marginBottom: nothingSpace.md,
  },
  kicker: {
    fontSize: nothingType.micro,
    fontWeight: '700',
    color: nothing.muted,
    letterSpacing: nothingType.letterWide,
    textTransform: 'uppercase',
  },
  panel: {
    backgroundColor: nothing.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: nothing.lineStrong,
    borderRadius: nothingRadius.md,
    padding: nothingSpace.lg,
    marginBottom: nothingSpace.md,
  },
  primary: {
    minHeight: touchMin,
    backgroundColor: nothing.invert,
    borderRadius: nothingRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nothingSpace.xl,
  },
  primaryText: {
    color: nothing.invertText,
    fontSize: nothingType.body,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  outline: {
    minHeight: touchMin,
    borderWidth: 1,
    borderColor: nothing.display,
    borderRadius: nothingRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nothingSpace.lg,
    backgroundColor: nothing.surface,
  },
  outlineText: {
    color: nothing.display,
    fontSize: nothingType.body,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  seg: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: nothing.display,
    borderRadius: nothingRadius.sm,
    overflow: 'hidden',
    marginBottom: nothingSpace.md,
  },
  segItem: {
    flex: 1,
    minHeight: touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: nothing.surface,
    paddingHorizontal: 4,
  },
  segOn: { backgroundColor: nothing.invert },
  segText: {
    fontSize: nothingType.caption,
    fontWeight: '700',
    color: nothing.secondary,
    letterSpacing: 0.3,
  },
  segTextOn: { color: nothing.invertText },
});
