import { memo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { DuplicatePolicySelector } from './DuplicatePolicySelector';
import { splitMultilineNames } from '../services/participantNormalization';
import type { DuplicatePolicy } from '../types';

interface AddNamesCardProps {
  policy: DuplicatePolicy;
  onPolicyChange: (policy: DuplicatePolicy) => void;
  /** Receives the typed names (one per line) and how many blank lines were ignored. Resolve to clear the input, reject/return false to keep it. */
  onAdd: (names: string[], blankSkipped: number) => boolean | void | Promise<boolean | void>;
  /** Result line shown under the field, e.g. "2 duplicates skipped". */
  message?: string | null;
  children?: ReactNode;
}

/** Quick-add field: one name, or several names separated by new lines. */
function AddNamesCardBase({ policy, onPolicyChange, onAdd, message, children }: AddNamesCardProps) {
  const { t } = useTranslation('projects');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const { names, blankSkipped } = splitMultilineNames(text);
    if (names.length === 0) {
      setError(t('add.emptyName'));
      return;
    }
    setBusy(true);
    try {
      const keep = await onAdd(names, blankSkipped);
      if (keep !== false) {
        setText('');
        setError(undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <View style={styles.input}>
          <AppInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (error) setError(undefined);
            }}
            placeholder={t('add.placeholder')}
            multiline
            multilineMinHeight={50}
            error={error}
            testID="add-names-input"
          />
        </View>
        <View style={styles.button}>
          <AppButton label={t('add.button')} compact fullWidth={false} loading={busy} onPress={submit} testID="add-names-button" />
        </View>
      </View>
      <AppText variant="caption" tone="muted">
        {t('add.multiHint')}
      </AppText>
      <DuplicatePolicySelector value={policy} onChange={onPolicyChange} />
      {message ? (
        <AppText variant="caption" tone="success" weight="medium" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

export const AddNamesCard = memo(AddNamesCardBase);

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  input: { flex: 1 },
  button: { paddingTop: 6 },
}));
