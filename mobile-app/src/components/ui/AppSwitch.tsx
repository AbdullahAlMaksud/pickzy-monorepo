import { memo } from 'react';
import { Platform, Switch as RNSwitch, View } from 'react-native';
import { Host, Switch as ComposeSwitch } from '@expo/ui/jetpack-compose';
import { useUnistyles } from 'react-native-unistyles';
import { haptic } from '@/utils/haptics';

export interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  testID?: string;
}

function AppSwitchBase({ value, onValueChange, label, disabled, testID }: AppSwitchProps) {
  const { theme } = useUnistyles();

  const handleToggle = (next: boolean) => {
    haptic.selection();
    onValueChange(next);
  };

  if (Platform.OS === 'android') {
    return (
      <View
        testID={testID}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
      >
        <Host matchContents>
          <ComposeSwitch
            value={value}
            enabled={!disabled}
            onCheckedChange={handleToggle}
            colors={{
              checkedThumbColor: '#FFFFFF',
              checkedTrackColor: theme.colors.primary,
              checkedBorderColor: theme.colors.primary,
              uncheckedThumbColor: '#FFFFFF',
              uncheckedTrackColor: theme.colors.switchTrackOff,
              uncheckedBorderColor: theme.colors.switchTrackOff,
            }}
          />
        </Host>
      </View>
    );
  }

  return (
    <RNSwitch
      testID={testID}
      value={value}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      onValueChange={handleToggle}
      trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.colors.switchTrackOff}
    />
  );
}

export const AppSwitch = memo(AppSwitchBase);
