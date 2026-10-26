import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { ChipRow } from '@/components/ui/ChipRow';
import type { DuplicatePolicy } from '../types';

interface Props {
  value: DuplicatePolicy;
  onChange: (value: DuplicatePolicy) => void;
}

/** Lets the user decide what happens to repeated names (see the policy documented in the README). */
function DuplicatePolicySelectorBase({ value, onChange }: Props) {
  const { t } = useTranslation('projects');
  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" tone="secondary" weight="medium">
        {t('duplicates.title')}
      </AppText>
      <ChipRow<DuplicatePolicy>
        options={[
          { value: 'keep', label: t('duplicates.keep') },
          { value: 'skip', label: t('duplicates.skip') },
        ]}
        value={value}
        onChange={onChange}
        accessibilityLabel={t('duplicates.title')}
        testIDPrefix="dup-policy"
      />
      <AppText variant="caption" tone="muted">
        {value === 'keep' ? t('duplicates.keepHint') : t('duplicates.skipHint')}
      </AppText>
    </View>
  );
}

export const DuplicatePolicySelector = memo(DuplicatePolicySelectorBase);

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.xs },
}));
