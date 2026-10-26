import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface ScreenContainerProps {
  children: ReactNode;
  /** Which safe-area edges to pad. Tab screens pad the top only (the tab bar handles the bottom). */
  edges?: ('top' | 'bottom')[];
  keyboardAvoiding?: boolean;
  tone?: 'background' | 'surface' | 'stage';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Root view of every screen: background color, safe-area padding and optional keyboard avoidance. */
export function ScreenContainer({
  children,
  edges = ['top', 'bottom'],
  keyboardAvoiding = false,
  tone = 'background',
  style,
  testID,
}: ScreenContainerProps) {
  styles.useVariants({ tone, top: edges.includes('top'), bottom: edges.includes('bottom') });
  const content = (
    <View testID={testID} style={[styles.container, style]}>
      {children}
    </View>
  );
  if (!keyboardAvoiding) return content;
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  fill: { flex: 1 },
  container: {
    flex: 1,
    variants: {
      tone: {
        background: { backgroundColor: theme.colors.background },
        surface: { backgroundColor: theme.colors.surface },
        stage: { backgroundColor: theme.colors.stage },
      },
      top: { true: { paddingTop: rt.insets.top }, false: {} },
      bottom: { true: { paddingBottom: rt.insets.bottom }, false: {} },
    },
  },
}));
