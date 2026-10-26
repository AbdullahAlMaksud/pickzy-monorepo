import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useLocale } from '@/hooks/useLocale';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { showToast } from '@/store/toastStore';
import { haptic } from '@/utils/haptics';
import { AddNamesCard } from '@/features/participants/components/AddNamesCard';
import { EditNameModal } from '@/features/participants/components/EditNameModal';
import { ImportPanel } from '@/features/participants/components/ImportPanel';
import { ParticipantList, type ParticipantItem } from '@/features/participants/components/ParticipantList';
import type { ParticipantId } from '@/features/participants/components/ParticipantRow';
import { useDraftParticipants } from '@/features/participants/hooks/useDraftParticipants';
import { describeBatch } from '@/features/participants/services/batchMessages';
import type { DuplicatePolicy } from '@/features/participants/types';
import { ProjectDetailsForm } from '../components/ProjectDetailsForm';
import { ProjectValidationError } from '../services/projectService';
import { hasErrors, validateProject, type ProjectErrors } from '../validation';

type Tab = 'manual' | 'import';
const SEARCH_THRESHOLD = 8;

export function NewProjectScreen() {
  const { t } = useTranslation(['projects', 'common']);
  const { number } = useLocale();
  const { projects } = useServices();
  const draft = useDraftParticipants();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<ProjectErrors>({});
  const [tab, setTab] = useState<Tab>('manual');
  const [policy, setPolicy] = useState<DuplicatePolicy>('keep');
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reorder, setReorder] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saving, setSaving] = useState(false);

  const count = draft.items.length;
  const query = search.trim().toLocaleLowerCase();
  const visible: ParticipantItem[] = useMemo(() => {
    const source = draft.items.map((i) => ({ id: i.key, name: i.name }));
    return query ? source.filter((i) => i.name.toLocaleLowerCase().includes(query)) : source;
  }, [draft.items, query]);

  const editingItem = draft.items.find((i) => i.key === editingKey);

  const handleManualAdd = useCallback(
    (names: string[], blankSkipped: number) => {
      const result = draft.add(names, policy, blankSkipped);
      setMessage(describeBatch(t, result.added, result));
      setErrors((e) => ({ ...e, participants: undefined }));
      if (result.added > 0) haptic.success();
      return true;
    },
    [draft, policy, t],
  );

  const handleImportConfirm = useCallback(
    (names: string[], report: { duplicatesFound: number; duplicatesSkipped: number; blankSkipped: number; truncated: number }) => {
      // Names were already filtered by the preview's duplicate policy; add them as-is ('keep').
      const result = draft.add(names, 'keep');
      setMessage(describeBatch(t, result.added, { ...report }));
      setErrors((e) => ({ ...e, participants: undefined }));
      setTab('manual');
      haptic.success();
    },
    [draft, t],
  );

  const handleCreate = async () => {
    const found = validateProject({ name, description }, count);
    setErrors(found);
    if (hasErrors(found)) {
      haptic.warning();
      return;
    }
    setSaving(true);
    try {
      const id = await projects.createProject({
        name,
        description,
        participantNames: draft.items.map((i) => i.name),
      });
      notifyDataChanged();
      showToast(t('projects:new.created'), 'success');
      router.replace(`/project/${id}`);
    } catch (error) {
      if (error instanceof ProjectValidationError) setErrors(error.errors);
      else showToast(t('common:errors.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={styles.headerContent}>
      <AppCard>
        <AppText variant="heading" accessibilityRole="header" style={styles.cardTitle}>
          {t('new.details')}
        </AppText>
        <ProjectDetailsForm
          name={name}
          description={description}
          errors={errors}
          onNameChange={(v) => {
            setName(v);
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          onDescriptionChange={setDescription}
        />
      </AppCard>

      <AppCard>
        <AppText variant="heading" accessibilityRole="header" style={styles.cardTitle}>
          {t('new.participantsSection')}
        </AppText>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'manual', label: t('tabs.manual'), testID: 'tab-manual' },
            { value: 'import', label: t('tabs.import'), testID: 'tab-import' },
          ]}
        />
        <View style={styles.tabBody}>
          {tab === 'manual' ? (
            <AddNamesCard policy={policy} onPolicyChange={setPolicy} onAdd={handleManualAdd} message={message} />
          ) : (
            <ImportPanel
              existingNames={draft.items.map((i) => i.name)}
              policy={policy}
              onPolicyChange={setPolicy}
              onConfirm={handleImportConfirm}
            />
          )}
        </View>
        {tab === 'import' && message ? (
          <AppText variant="caption" tone="success" weight="medium">
            {message}
          </AppText>
        ) : null}
      </AppCard>

      {errors.participants ? (
        <AppText variant="caption" tone="error" accessibilityRole="alert">
          {t('validation.participantsEmpty')}
        </AppText>
      ) : null}

      <SectionHeader
        title={t('add.listTitle', { count })}
        right={
          count > 0 ? (
            <View style={styles.listActions}>
              {count > 1 ? (
                <IconButton
                  icon="list-ordered"
                  label={t('manage.reorder')}
                  variant={reorder ? 'soft' : 'plain'}
                  color={reorder ? 'primary' : 'textSecondary'}
                  size="sm"
                  onPress={() => setReorder((v) => !v)}
                  testID="toggle-reorder"
                />
              ) : null}
              <AppButton label={t('add.clearAll')} variant="ghost" compact fullWidth={false} onPress={() => setConfirmClear(true)} testID="clear-all" />
            </View>
          ) : undefined
        }
      />
      {count > SEARCH_THRESHOLD ? (
        <SearchInput value={search} onChangeText={setSearch} placeholder={t('add.searchPlaceholder')} />
      ) : null}
    </View>
  );

  return (
    <ScreenContainer>
      <ScreenHeader title={t('new.title')} />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ParticipantList
          items={visible}
          mode={reorder && !query ? 'reorder' : 'default'}
          header={header}
          empty={
            <View style={styles.empty}>
              <AppText variant="caption" tone="muted" align="center">
                {query ? t('add.noMatches') : t('add.empty')}
              </AppText>
            </View>
          }
          onRemove={(id: ParticipantId) => draft.remove(String(id))}
          onEdit={(id: ParticipantId) => setEditingKey(String(id))}
          onMove={(id: ParticipantId, dir) => draft.move(String(id), dir)}
        />
        <View style={styles.footer}>
          <AppButton
            label={saving ? t('new.creating') : t('new.create', { count })}
            onPress={handleCreate}
            loading={saving}
            testID="create-project"
          />
        </View>
      </KeyboardAvoidingView>

      <EditNameModal
        visible={editingKey !== null}
        initialName={editingItem?.name ?? ''}
        onClose={() => setEditingKey(null)}
        onSave={(next) => {
          if (editingKey) draft.rename(editingKey, next);
          setEditingKey(null);
        }}
      />
      <ConfirmDialog
        visible={confirmClear}
        title={t('add.clearAllTitle')}
        message={t('add.clearAllMessage')}
        confirmLabel={t('add.clearAllConfirm')}
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          draft.clear();
          setMessage(null);
          setSearch('');
          setReorder(false);
          setConfirmClear(false);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  fill: { flex: 1 },
  headerContent: { gap: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  cardTitle: { marginBottom: theme.spacing.md },
  tabBody: { marginTop: theme.spacing.md },
  listActions: { flexDirection: 'row', alignItems: 'center' },
  empty: { padding: theme.spacing.xl },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
}));
