import { type ReactNode } from 'react';
import { ScrollView, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ScreenContainer } from './ScreenContainer';

interface SafeScreenProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  edges?: ('top' | 'bottom')[];
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  testID?: string;
}

/** Header + scrolling body + sticky footer, with safe areas and keyboard handling. */
export function SafeScreen({
  header,
  children,
  footer,
  edges = ['top', 'bottom'],
  scroll = true,
  keyboardAvoiding = true,
  contentStyle,
  refreshControl,
  testID,
}: SafeScreenProps) {
  return (
    <ScreenContainer edges={edges} keyboardAvoiding={keyboardAvoiding} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {footer}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  fill: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl, gap: theme.spacing.lg },
}));
