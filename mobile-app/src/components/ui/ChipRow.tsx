import { memo } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { haptic } from '@/utils/haptics';
import { AppText } from './AppText';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChipRowProps<T extends string | number> {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  testIDPrefix?: string;
}

/** Horizontally scrolling single-select chips (worksheets, columns, duplicate policy). */
function ChipRowBase<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  testIDPrefix,
}: ChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={accessibilityLabel}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            testID={testIDPrefix ? `${testIDPrefix}-${option.value}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              haptic.selection();
              onChange(option.value);
            }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <AppText variant="label" weight="medium" tone={selected ? 'onPrimary' : 'secondary'} numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const ChipRow = memo(ChipRowBase) as typeof ChipRowBase;

const styles = StyleSheet.create((theme) => ({
  row: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  chip: {
    minHeight: 38,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  chipSelected: { backgroundColor: theme.colors.primary },
}));
