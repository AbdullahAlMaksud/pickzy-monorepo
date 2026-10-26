import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppModal } from '@/components/ui/AppModal';
import { AppText } from '@/components/ui/AppText';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorView } from '@/components/ui/ErrorView';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingView } from '@/components/ui/LoadingView';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAsyncQuery } from '@/hooks/useAsyncQuery';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { showToast } from '@/store/toastStore';
import { haptic } from '@/utils/haptics';
import { EditProjectModal } from '@/features/projects/components/EditProjectModal';
import { ProjectValidationError } from '@/features/projects/services/projectService';
import { AddNamesCard } from '../components/AddNamesCard';
import { EditNameModal } from '../components/EditNameModal';
import { ImportPanel } from '../components/ImportPanel';
import { ParticipantList, type ParticipantItem } from '../components/ParticipantList';
import type { ParticipantId, ParticipantMode } from '../components/ParticipantRow';
import { describeBatch } from '../services/batchMessages';
import type { DuplicatePolicy } from '../types';

const SEARCH_THRESHOLD = 8;

type Dialog = null | 'clear' | 'deleteSelected' | 'deleteProject';

export function ParticipantsScreen({ projectId }: { projectId: number }) {
  const { t } = useTranslation(['projects', 'common']);
  const { participants: service, projects } = useServices();

  const query = useAsyncQuery(
    async (s) => {
      const project = await s.projects.getProject(projectId);
      if (!project) return null;
      return { project, participants: await s.participants.list(projectId) };
    },
    [projectId],
  );

  const [policy, setPolicy] = useState<DuplicatePolicy>('keep');
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<ParticipantMode>('default');
  const [selected, setSelected] = useState<ReadonlySet<ParticipantId>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const data = query.data;
  const all = data?.participants;
  const names = useMemo(() => (all ?? []).map((p) => p.displayName), [all]);
  const q = search.trim().toLocaleLowerCase();
  const items: ParticipantItem[] = useMemo(() => {
    const source = (all ?? []).map((p) => ({ id: p.id, name: p.displayName }));
    return q ? source.filter((i) => i.name.toLocaleLowerCase().includes(q)) : source;
  }, [all, q]);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
        notifyDataChanged();
      } catch {
        showToast(t('common:errors.saveFailed'), 'error');
      }
    },
    [t],
  );

  const handleAdd = useCallback(
    async (typed: string[], blankSkipped: number) => {
      let ok = true;
      await run(async () => {
        const result = await service.addNames(projectId, typed, policy);
        setMessage(describeBatch(t, result.inserted, { ...result, blankSkipped: result.blankSkipped + blankSkipped }));
        if (result.inserted > 0) haptic.success();
      }).catch(() => {
        ok = false;
      });
      return ok;
    },
    [service, projectId, policy, run, t],
  );

  const handleImport = useCallback(
    async (
      imported: string[],
      report: { duplicatesFound: number; duplicatesSkipped: number; blankSkipped: number; truncated: number },
    ) => {
      setImportOpen(false);
      await run(async () => {
        const result = await service.addNames(projectId, imported, 'keep');
        setMessage(describeBatch(t, result.inserted, { ...report }));
        haptic.success();
      });
    },
    [service, projectId, run, t],
  );

  const toggleSelect = useCallback((id: ParticipantId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const changeMode = (next: ParticipantMode) => {
    setMode((current) => (current === next ? 'default' : next));
    setSelected(new Set());
  };

  const removeOne = useCallback(
    (id: ParticipantId) =>
      void run(async () => {
        await service.remove(projectId, [Number(id)]);
        showToast(t('projects:manage.removedOne'), 'info');
      }),
    [run, service, projectId, t],
  );

  const move = useCallback(
    (id: ParticipantId, direction: 'up' | 'down') =>
      void run(async () => {
        await service.move(projectId, Number(id), direction);
        haptic.selection();
      }),
    [run, service, projectId],
  );

  const edited = all?.find((p) => p.id === editingId);

  if (query.loading && !data) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('manage.title')} />
        <LoadingView />
      </ScreenContainer>
    );
  }
  if (query.error || !data) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('manage.title')} />
        <ErrorView
          title={data === null ? t('manage.projectNotFound') : undefined}
          message={data === null ? undefined : t('common:errors.loadFailed')}
          onRetry={data === null ? () => router.replace('/') : query.reload}
        />
      </ScreenContainer>
    );
  }

  const count = data.participants.length;
  const selectedCount = selected.size;

  const header = (
    <View style={styles.headerContent}>
      <AppCard>
        <AppText variant="heading" accessibilityRole="header" style={styles.cardTitle}>
          {t('manage.addTitle')}
        </AppText>
        <AddNamesCard policy={policy} onPolicyChange={setPolicy} onAdd={handleAdd} message={message}>
          <AppButton label={t('manage.importMore')} icon="upload" variant="secondary" compact onPress={() => setImportOpen(true)} testID="open-import" />
        </AddNamesCard>
      </AppCard>

      <AppText variant="caption" tone="muted">
        {t('manage.drawNote')}
      </AppText>

      <View style={styles.listHeader}>
        <AppText variant="heading" accessibilityRole="header" style={styles.flex}>
          {t('add.listTitle', { count })}
        </AppText>
        {count > 0 ? (
          <View style={styles.toolbar}>
            <IconButton
              icon="square-check"
              label={t('manage.select')}
              size="sm"
              variant={mode === 'select' ? 'soft' : 'plain'}
              color={mode === 'select' ? 'primary' : 'textSecondary'}
              onPress={() => changeMode('select')}
              testID="toggle-select"
            />
            {count > 1 ? (
              <IconButton
                icon="list-ordered"
                label={t('manage.reorder')}
                size="sm"
                variant={mode === 'reorder' ? 'soft' : 'plain'}
                color={mode === 'reorder' ? 'primary' : 'textSecondary'}
                onPress={() => changeMode('reorder')}
                testID="toggle-reorder"
              />
            ) : null}
            <IconButton icon="trash-2" label={t('manage.clearList')} size="sm" color="error" onPress={() => setDialog('clear')} testID="clear-list" />
          </View>
        ) : null}
      </View>

      {count > SEARCH_THRESHOLD ? <SearchInput value={search} onChangeText={setSearch} placeholder={t('add.searchPlaceholder')} /> : null}

      {mode === 'select' ? (
        <View style={styles.selectBar}>
          <AppText variant="label" tone="primary" weight="semibold" style={styles.flex}>
            {t('common:selected', { count: selectedCount })}
          </AppText>
          <AppButton
            label={selectedCount === items.length && items.length > 0 ? t('manage.clearSelection') : t('manage.selectAll')}
            variant="ghost"
            compact
            fullWidth={false}
            onPress={() => setSelected(selectedCount === items.length ? new Set() : new Set(items.map((i) => i.id)))}
          />
          <AppButton
            label={t('manage.deleteSelected')}
            variant="destructive"
            compact
            fullWidth={false}
            disabled={selectedCount === 0}
            onPress={() => setDialog('deleteSelected')}
            testID="delete-selected"
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title={data.project.name}
        subtitle={t('common:participants', { count })}
        right={<IconButton icon="pencil" label={t('manage.editProject')} onPress={() => setProjectOpen(true)} testID="edit-project" />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ParticipantList
          items={items}
          mode={mode === 'reorder' && q ? 'default' : mode}
          selectedIds={selected}
          header={header}
          empty={
            <View style={styles.empty}>
              <AppText variant="caption" tone="muted" align="center">
                {q ? t('add.noMatches') : t('manage.empty')}
              </AppText>
            </View>
          }
          onRemove={removeOne}
          onEdit={(id) => setEditingId(Number(id))}
          onMove={move}
          onToggleSelect={toggleSelect}
        />
        <View style={styles.footer}>
          <AppButton
            label={t('manage.startSpinning')}
            icon="arrow-right"
            disabled={count === 0}
            onPress={() => router.push(`/project/${projectId}`)}
            testID="start-spinning"
          />
        </View>
      </KeyboardAvoidingView>

      <AppModal visible={importOpen} onClose={() => setImportOpen(false)} title={t('import.title')} variant="sheet">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ImportPanel existingNames={names} policy={policy} onPolicyChange={setPolicy} onConfirm={handleImport} />
        </ScrollView>
      </AppModal>

      <EditNameModal
        visible={editingId !== null}
        initialName={edited?.displayName ?? ''}
        onClose={() => setEditingId(null)}
        onSave={async (name) => {
          const id = editingId;
          setEditingId(null);
          if (id !== null) {
            await run(async () => {
              await service.rename(projectId, id, name);
              showToast(t('projects:manage.renamed'), 'success');
            });
          }
        }}
      />

      <EditProjectModal
        visible={projectOpen}
        initialName={data.project.name}
        initialDescription={data.project.description}
        onClose={() => setProjectOpen(false)}
        onDelete={() => {
          setProjectOpen(false);
          setDialog('deleteProject');
        }}
        onSave={async (input) => {
          try {
            await projects.updateProject(projectId, input);
            notifyDataChanged();
            setProjectOpen(false);
            showToast(t('projects:manage.updated'), 'success');
          } catch (error) {
            if (!(error instanceof ProjectValidationError)) showToast(t('common:errors.saveFailed'), 'error');
          }
        }}
      />

      <ConfirmDialog
        visible={dialog === 'clear'}
        title={t('manage.clearListTitle')}
        message={t('manage.clearListMessage')}
        confirmLabel={t('manage.clearList')}
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          void run(async () => {
            await service.clear(projectId);
            setSelected(new Set());
            showToast(t('projects:manage.cleared'), 'info');
          });
        }}
      />
      <ConfirmDialog
        visible={dialog === 'deleteSelected'}
        title={t('manage.deleteSelectedTitle', { count: selectedCount })}
        message={t('manage.deleteSelectedMessage')}
        confirmLabel={t('common:delete')}
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          const ids = [...selected].map(Number);
          void run(async () => {
            const removed = await service.remove(projectId, ids);
            setSelected(new Set());
            setMode('default');
            showToast(removed === 1 ? t('projects:manage.removedOne') : t('projects:manage.removed', { count: removed }), 'info');
          });
        }}
      />
      <ConfirmDialog
        visible={dialog === 'deleteProject'}
        title={t('manage.deleteProjectTitle')}
        message={t('manage.deleteProjectMessage')}
        confirmLabel={t('manage.deleteProject')}
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          void run(async () => {
            await projects.deleteProject(projectId);
            showToast(t('projects:manage.deleted'), 'info');
            router.replace('/');
          });
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  headerContent: { gap: theme.spacing.md, paddingBottom: theme.spacing.sm },
  cardTitle: { marginBottom: theme.spacing.md },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toolbar: { flexDirection: 'row', alignItems: 'center' },
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primarySofter,
  },
  empty: { padding: theme.spacing.xl },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
}));
