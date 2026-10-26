import { memo } from 'react';
import { Switch } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { haptic } from '@/utils/haptics';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  testID?: string;
}

function AppSwitchBase({ value, onValueChange, label, disabled, testID }: AppSwitchProps) {
  const { theme } = useUnistyles();
  return (
    <Switch
      testID={testID}
      value={value}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      onValueChange={(next) => {
        haptic.selection();
        onValueChange(next);
      }}
      trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.colors.switchTrackOff}
    />
  );
}

export const AppSwitch = memo(AppSwitchBase);
