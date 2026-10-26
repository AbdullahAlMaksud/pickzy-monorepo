import { memo, useEffect } from 'react';
import { AccessibilityInfo, Modal, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ConfettiEffect } from '@/components/feedback/ConfettiEffect';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/appStore';
import { haptic } from '@/utils/haptics';

interface WinnerModalProps {
  visible: boolean;
  winnerId: number | null;
  winnerName: string;
  projectName: string;
  order: number;
  /** True when the requested number of winners has been reached. */
  isLast: boolean;
  /** Someone can still be drawn for the next place (the draw can be extended). */
  canContinue: boolean;
  /** The winner is taken off the wheel for the following spins. */
  removedFromWheel: boolean;
  busy: boolean;
  colorIndex: number;
  onNext: () => void;
  onFinish: () => void;
  onClose: () => void;
}

function WinnerModalBase({
  visible,
  winnerId,
  winnerName,
  projectName,
  order,
  isLast,
  canContinue,
  removedFromWheel,
  busy,
  colorIndex,
  onNext,
  onFinish,
  onClose,
}: WinnerModalProps) {
  const { t } = useTranslation('wheel');
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const confettiEnabled = useAppStore((s) => s.preferences.confetti);

  const { ordinal } = useLocale();
  const place = ordinal(order);
  const announcement = t('modal.announce', { name: winnerName, place });

  useEffect(() => {
    if (!visible) return;
    haptic.success();
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [visible, announcement]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          entering={reducedMotion ? undefined : ZoomIn.springify().damping(14)}
          style={styles.card}
          accessibilityViewIsModal
          testID="winner-modal"
        >
          <View style={styles.crownWrap}>
            <Icon name="crown" size="xl" color="gold" />
          </View>
          <AppText variant="title" align="center" accessibilityRole="header" testID="winner-heading">
            {t('modal.heading')}
          </AppText>
          <View style={styles.winnerBlock}>
            <Avatar name={winnerName} size={72} colorIndex={colorIndex} />
            <AppText variant="display" align="center" numberOfLines={3} testID="winner-name" style={styles.name}>
              {winnerName}
            </AppText>
          </View>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Icon name="circle-check" size="sm" color="success" />
              <AppText variant="caption" tone="success" weight="semibold">
                {t('modal.saved')}
              </AppText>
            </View>
            <View style={[styles.badge, styles.badgeNeutral]}>
              <AppText variant="caption" weight="semibold" tone="primary">
                {t('modal.winnerNumber', { place })}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" tone="muted" align="center" numberOfLines={2}>
            {t('modal.project', { name: projectName })}
          </AppText>
          {canContinue && removedFromWheel ? (
            <AppText variant="caption" tone="muted" align="center">
              {t('modal.keepNote', { name: winnerName })}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {canContinue ? (
              <AppButton
                label={t('modal.next', { place: ordinal(order + 1) })}
                onPress={onNext}
                loading={busy}
                iconRight="arrow-right"
                testID="winner-next"
              />
            ) : null}
            {isLast || !canContinue ? (
              <AppButton
                label={t('modal.finish')}
                onPress={onFinish}
                loading={busy}
                icon="trophy"
                variant={canContinue ? 'secondary' : 'primary'}
                testID="winner-finish"
              />
            ) : null}
            <AppButton label={t('modal.close')} variant="secondary" onPress={onClose} disabled={busy} testID="winner-close" />
          </View>
        </Animated.View>
        {/* Confetti starts only now: the wheel has fully stopped before this modal is shown. */}
        <ConfettiEffect
          burstKey={winnerId ?? 0}
          active={visible && confettiEnabled && !reducedMotion}
          width={width}
          height={height}
        />
      </View>
    </Modal>
  );
}

export const WinnerModal = memo(WinnerModalBase);

const styles = StyleSheet.create((theme) => ({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    alignItems: 'stretch',
    ...theme.shadows.lg,
  },
  crownWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.winnerCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBlock: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm },
  name: { color: theme.colors.primary },
  badges: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: theme.spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.successSoft,
  },
  badgeNeutral: { backgroundColor: theme.colors.primarySoft },
  actions: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
}));
