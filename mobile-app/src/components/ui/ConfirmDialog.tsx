import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppText } from './AppText';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogBase({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  return (
    <AppModal visible={visible} onClose={onCancel} variant="center" showClose={false} testID="confirm-dialog">
      <View style={styles.body} accessibilityRole="alert">
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        <AppText tone="secondary">{message}</AppText>
      </View>
      <View style={styles.actions}>
        <AppButton
          label={cancelLabel ?? t('cancel')}
          variant="secondary"
          onPress={onCancel}
          disabled={loading}
          style={styles.action}
          fullWidth={false}
          testID="confirm-cancel"
        />
        <AppButton
          label={confirmLabel}
          variant={destructive ? 'destructive' : 'primary'}
          onPress={onConfirm}
          loading={loading}
          style={styles.action}
          fullWidth={false}
          testID="confirm-ok"
        />
      </View>
    </AppModal>
  );
}

export const ConfirmDialog = memo(ConfirmDialogBase);

const styles = StyleSheet.create((theme) => ({
  body: { gap: theme.spacing.sm },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  action: { flex: 1 },
}));
