import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useLocale } from '@/hooks/useLocale';
import type { DrawRules } from '@/features/wheel/types';

interface Props {
  session: DrawRules;
}

/** The rules a draw ran with. History shows the values saved with the draw, never the current ones. */
function RulesSummaryBase({ session }: Props) {
  const { t } = useTranslation('history');
  const { number } = useLocale();
  const rows: [string, string][] = [
    [t('detail.winnerCount'), number(session.requestedWinnerCount)],
    [t('detail.repeat'), session.allowRepeatWinners ? t('detail.repeatOn') : t('detail.repeatOff')],
    [t('detail.removed'), session.removeSelectedWinners ? t('detail.removedOn') : t('detail.removedOff')],
  ];
  return (
    <AppCard testID="rules-summary">
      <AppText variant="heading" accessibilityRole="header" style={styles.title}>
        {t('detail.rulesHeading')}
      </AppText>
      <View style={styles.rows}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <AppText variant="body" tone="secondary" style={styles.label}>
              {label}
            </AppText>
            <AppText variant="body" weight="semibold">
              {value}
            </AppText>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

export const RulesSummary = memo(RulesSummaryBase);

const styles = StyleSheet.create((theme) => ({
  title: { marginBottom: theme.spacing.md },
  rows: { gap: theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md },
  label: { flex: 1 },
}));
