import { forwardRef, type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';
import { space } from '../theme/tokens';

type Variant = 'screen' | 'sheet';

type Props = Omit<ScrollViewProps, 'keyboardShouldPersistTaps' | 'keyboardDismissMode'> & {
  children: ReactNode;
  /** screen = full tab/page; sheet = already lifted by SwipeToDismissSheet */
  variant?: Variant;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * ScrollView tuned for forms: keep taps working, dismiss keyboard on drag,
 * and leave room so focused fields stay above the soft keyboard.
 */
export const FormScrollView = forwardRef<ScrollView, Props>(function FormScrollView(
  { children, variant = 'screen', contentContainerStyle, style, ...rest },
  ref,
) {
  const keyboardInset = useKeyboardBottomInset();
  const bottomPad =
    variant === 'screen'
      ? space.xxl + Math.max(space.lg, keyboardInset)
      : space.xl + (keyboardInset > 0 ? space.md : 0);

  return (
    <ScrollView
      ref={ref}
      style={style}
      contentContainerStyle={[styles.base, { paddingBottom: bottomPad }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={variant === 'screen'}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
  },
});
