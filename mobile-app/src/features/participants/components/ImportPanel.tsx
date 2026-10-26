import { memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/ui/AppButton';
import { AppSwitch } from '@/components/ui/AppSwitch';
import { AppText } from '@/components/ui/AppText';
import { ChipRow } from '@/components/ui/ChipRow';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/hooks/useLocale';
import { useImportFlow } from '../hooks/useImportFlow';
import { DuplicatePolicySelector } from './DuplicatePolicySelector';
import type { DuplicatePolicy } from '../types';

const PREVIEW_LIMIT = 40;

interface ImportPanelProps {
  existingNames: readonly string[];
  policy: DuplicatePolicy;
  onPolicyChange: (policy: DuplicatePolicy) => void;
  /** Called when the user confirms. `skippedDuplicates` etc. let the parent report what was dropped. */
  onConfirm: (names: string[], report: { duplicatesFound: number; duplicatesSkipped: number; blankSkipped: number; truncated: number }) => void;
}

/** File import: choose a .txt / .csv / .xlsx, pick worksheet + name column, review, confirm. */
function ImportPanelBase({ existingNames, policy, onPolicyChange, onConfirm }: ImportPanelProps) {
  const { t } = useTranslation(['projects', 'common']);
  const { number } = useLocale();
  const flow = useImportFlow(existingNames, policy);

  const changePolicy = (value: DuplicatePolicy) => {
    flow.setPolicy(value);
    onPolicyChange(value);
  };

  const { preview } = flow;

  if (!flow.fileName) {
    return (
      <View style={styles.drop}>
        <View style={styles.dropIcon}>
          <Icon name="upload" size="lg" color="primary" />
        </View>
        <AppText variant="label" weight="semibold">
          {t('projects:import.dropTitle')}
        </AppText>
        <AppText variant="caption" tone="muted" align="center">
          {t('projects:import.supports')}
        </AppText>
        {flow.errorCode ? (
          <AppText variant="caption" tone="error" align="center" accessibilityRole="alert" testID="import-error">
            {t(`projects:import.errors.${flow.errorCode}`)}
          </AppText>
        ) : null}
        <AppButton
          label={flow.loading ? t('projects:import.reading') : t('projects:import.choose')}
          variant="secondary"
          compact
          fullWidth={false}
          loading={flow.loading}
          onPress={flow.chooseFile}
          testID="import-choose-file"
        />
      </View>
    );
  }

  const shown = flow.names.slice(0, PREVIEW_LIMIT);

  return (
    <View style={styles.wrapper} testID="import-preview">
      <View style={styles.fileRow}>
        <Icon name="file-spreadsheet" size="md" color="primary" />
        <View style={styles.fileText}>
          <AppText variant="caption" tone="muted">
            {t('projects:import.file')}
          </AppText>
          <AppText variant="label" weight="semibold" numberOfLines={1}>
            {flow.fileName}
          </AppText>
        </View>
        <AppButton label={t('projects:import.choose')} variant="outline" compact fullWidth={false} onPress={flow.chooseFile} loading={flow.loading} />
      </View>

      {flow.errorCode ? (
        <AppText variant="caption" tone="error" accessibilityRole="alert">
          {t(`projects:import.errors.${flow.errorCode}`)}
        </AppText>
      ) : null}

      {flow.sheetNames.length > 1 ? (
        <View style={styles.field}>
          <AppText variant="caption" tone="secondary" weight="medium">
            {t('projects:import.sheet')}
          </AppText>
          <ChipRow<number>
            options={flow.sheetNames.map((name, i) => ({ value: i, label: name }))}
            value={flow.sheetIndex}
            onChange={(i) => void flow.selectSheet(i)}
            testIDPrefix="import-sheet"
          />
        </View>
      ) : null}

      {flow.columns.length > 1 ? (
        <View style={styles.field}>
          <AppText variant="caption" tone="secondary" weight="medium">
            {t('projects:import.column')}
          </AppText>
          <ChipRow<number>
            options={flow.columns.map((c) => ({
              value: c.index,
              label: t('projects:import.columnOption', { label: c.label, count: c.nonEmpty }),
            }))}
            value={flow.columnIndex}
            onChange={flow.setColumn}
            testIDPrefix="import-column"
          />
        </View>
      ) : null}

      <AppSwitch label={t('projects:import.hasHeader')} value={flow.hasHeader} onValueChange={flow.setHasHeader} testID="import-header-switch" />
      {preview?.headerSkipped ? (
        <AppText variant="caption" tone="muted">
          {t('projects:import.headerSkipped', { name: preview.headerSkipped })}
        </AppText>
      ) : null}

      <DuplicatePolicySelector value={flow.policy} onChange={changePolicy} />

      {preview ? (
        <View style={styles.stats}>
          <Stat label={t('projects:import.stats.rows')} value={number(preview.totalRows)} />
          <Stat label={t('projects:import.stats.valid')} value={number(preview.validRows)} />
          <Stat label={t('projects:import.stats.blank')} value={number(preview.blankSkipped)} />
          <Stat label={t('projects:import.stats.duplicates')} value={number(preview.duplicatesFound)} />
        </View>
      ) : null}

      <View style={styles.previewBox}>
        <AppText variant="label" weight="semibold">
          {t('projects:import.previewTitle', { count: flow.names.length })}
        </AppText>
        {flow.names.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('projects:import.nothingToImport')}
          </AppText>
        ) : (
          <View style={styles.previewList}>
            {shown.map((name, i) => (
              <AppText key={`${i}-${name}`} variant="body" numberOfLines={1}>
                {name}
              </AppText>
            ))}
            {flow.names.length > shown.length ? (
              <AppText variant="caption" tone="muted">
                {t('projects:import.moreRows', { count: flow.names.length - shown.length })}
              </AppText>
            ) : null}
          </View>
        )}
      </View>

      <AppButton
        label={t('projects:import.confirm', { count: flow.names.length })}
        disabled={flow.names.length === 0 || flow.loading}
        onPress={() => {
          if (!preview) return;
          onConfirm(flow.names, {
            duplicatesFound: preview.duplicatesFound,
            duplicatesSkipped: preview.duplicatesSkipped,
            blankSkipped: preview.blankSkipped,
            truncated: preview.truncated,
          });
          flow.reset();
        }}
        testID="import-confirm"
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title" tone="primary">
        {value}
      </AppText>
      <AppText variant="micro" tone="muted" align="center">
        {label}
      </AppText>
    </View>
  );
}

export const ImportPanel = memo(ImportPanelBase);

const styles = StyleSheet.create((theme) => ({
  wrapper: { gap: theme.spacing.md },
  drop: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySofter,
  },
  dropIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  fileText: { flex: 1 },
  field: { gap: theme.spacing.xs },
  stats: { flexDirection: 'row', gap: theme.spacing.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  previewBox: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  previewList: { gap: 4 },
}));
