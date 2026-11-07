import { memo, useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  ZoomIn,
  ZoomOut,
  useReducedMotion,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ANIM_DURATION = 280;
const EXIT_DURATION = 150;

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** `sheet` slides from the bottom, `center` is a floating modal card. */
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
  variant = 'center',
  dismissable = true,
  showClose = true,
  testID,
}: AppModalProps) {
  const { t } = useTranslation('common');
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (!visible && mounted) {
      const timer = setTimeout(() => {
        setMounted(false);
      }, EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [visible, mounted]);

  styles.useVariants({ variant });

  const enteringAnimation = reducedMotion
    ? undefined
    : variant === 'sheet'
      ? FadeInDown.duration(ANIM_DURATION)
      : ZoomIn.duration(ANIM_DURATION);

  const exitingAnimation = reducedMotion
    ? undefined
    : variant === 'sheet'
      ? FadeOutDown.duration(EXIT_DURATION)
      : ZoomOut.duration(EXIT_DURATION);

  const backdropEntering = reducedMotion ? undefined : FadeIn.duration(ANIM_DURATION);
  const backdropExiting = reducedMotion ? undefined : FadeOut.duration(EXIT_DURATION);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}
    >
      {visible ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <AnimatedPressable
            entering={backdropEntering}
            exiting={backdropExiting}
            style={styles.backdrop}
            onPress={dismissable ? onClose : undefined}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            accessible={dismissable}
          />
          <View style={styles.positioner} pointerEvents="box-none">
            <Animated.View
              entering={enteringAnimation}
              exiting={exitingAnimation}
              style={styles.sheet}
              testID={testID}
              accessibilityViewIsModal
            >
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
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      ) : null}
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
        center: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.lg,
        },
      },
    },
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    maxHeight: rt.screen.height * 0.88,
    variants: {
      variant: {
        sheet: {
          borderTopLeftRadius: theme.radii.xl,
          borderTopRightRadius: theme.radii.xl,
          paddingBottom: theme.spacing.xl + rt.insets.bottom,
        },
        center: {
          width: '100%',
          maxWidth: 420,
          borderRadius: theme.radii.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.lg,
        },
      },
    },
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
}));
