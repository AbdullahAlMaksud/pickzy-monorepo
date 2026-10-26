import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { useLocale } from '@/hooks/useLocale';

interface WinnerCountStepperProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function WinnerCountStepperBase({ value, min = 1, max, disabled, onChange }: WinnerCountStepperProps) {
  const { t } = useTranslation('wheel');
  const { number } = useLocale();
  return (
    <View style={styles.row}>
      <IconButton
        icon="circle-minus"
        label={t('settingsScreen.decrease')}
        variant="soft"
        color="primary"
        disabled={disabled || value <= min}
        onPress={() => onChange(value - 1)}
        testID="winner-count-minus"
      />
      <AppText variant="heading" align="center" style={styles.value} accessibilityLiveRegion="polite" testID="winner-count-value">
        {number(value)}
      </AppText>
      <IconButton
        icon="plus"
        label={t('settingsScreen.increase')}
        variant="soft"
        color="primary"
        disabled={disabled || value >= max}
        onPress={() => onChange(value + 1)}
        testID="winner-count-plus"
      />
    </View>
  );
}

export const WinnerCountStepper = memo(WinnerCountStepperBase);

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  value: { minWidth: 34 },
}));
