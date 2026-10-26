import { memo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** `sheet` slides from the bottom (pickers), `center` is a dialog. */
  variant?: 'sheet' | 'center';
  /** Prevent closing by tapping the backdrop or the Android back button (e.g. during a reveal). */
  dismissable?: boolean;
  showClose?: boolean;
  testID?: string;
}

function AppModalBase({
  visible,
  onClose,
  children,
  title,
  variant = 'sheet',
  dismissable = true,
  showClose = true,
  testID,
}: AppModalProps) {
  const { t } = useTranslation('common');
  styles.useVariants({ variant });
  return (
    <Modal
      visible={visible}
      transparent
      animationType={variant === 'sheet' ? 'slide' : 'fade'}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={dismissable ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          accessible={dismissable}
        />
        <View style={styles.positioner} pointerEvents="box-none">
          <View style={styles.sheet} testID={testID} accessibilityViewIsModal>
            {title || showClose ? (
              <View style={styles.header}>
                <AppText variant="heading" style={styles.title} accessibilityRole="header">
                  {title ?? ''}
                </AppText>
                {showClose && dismissable ? (
                  <IconButton icon="x" label={t('close')} onPress={onClose} color="textSecondary" />
                ) : null}
              </View>
            ) : null}
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const AppModal = memo(AppModalBase);

const styles = StyleSheet.create((theme, rt) => ({
  fill: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  positioner: {
    flex: 1,
    variants: {
      variant: {
        sheet: { justifyContent: 'flex-end' },
        center: { justifyContent: 'center', paddingHorizontal: theme.spacing.xl },
      },
    },
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    maxHeight: rt.screen.height * 0.9,
    variants: {
      variant: {
        sheet: {
          borderTopLeftRadius: theme.radii.xl,
          borderTopRightRadius: theme.radii.xl,
          paddingBottom: theme.spacing.xl + rt.insets.bottom,
        },
        center: { borderRadius: theme.radii.xl, ...theme.shadows.lg },
      },
    },
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
}));
