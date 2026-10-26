import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';

export type ParticipantId = string | number;
export type ParticipantMode = 'default' | 'reorder' | 'select';

interface ParticipantRowProps {
  id: ParticipantId;
  name: string;
  index: number;
  mode: ParticipantMode;
  selected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove?: (id: ParticipantId) => void;
  onEdit?: (id: ParticipantId) => void;
  onMove?: (id: ParticipantId, direction: 'up' | 'down') => void;
  onToggleSelect?: (id: ParticipantId) => void;
}

function ParticipantRowBase({
  id,
  name,
  index,
  mode,
  selected,
  canMoveUp,
  canMoveDown,
  onRemove,
  onEdit,
  onMove,
  onToggleSelect,
}: ParticipantRowProps) {
  const { t } = useTranslation('projects');
  const press = mode === 'select' ? () => onToggleSelect?.(id) : onEdit ? () => onEdit(id) : undefined;

  return (
    <View style={[styles.row, selected && styles.rowSelected]}>
      <Pressable
        style={styles.main}
        disabled={!press}
        onPress={press}
        accessibilityRole={mode === 'select' ? 'checkbox' : 'button'}
        accessibilityState={mode === 'select' ? { checked: selected } : undefined}
        accessibilityLabel={mode === 'select' ? t('manage.toggleSelect', { name }) : t('add.editOne', { name })}
      >
        {mode === 'select' ? (
          <View style={[styles.check, selected && styles.checkOn]}>
            {selected ? <Icon name="check" size="xs" color="onPrimary" /> : null}
          </View>
        ) : (
          <Avatar name={name} size={36} colorIndex={index} />
        )}
        <AppText variant="body" weight="medium" numberOfLines={2} style={styles.name}>
          {name}
        </AppText>
      </Pressable>

      {mode === 'reorder' ? (
        <View style={styles.actions}>
          <IconButton icon="arrow-up" label={t('manage.moveUp', { name })} size="sm" disabled={!canMoveUp} onPress={() => onMove?.(id, 'up')} />
          <IconButton icon="arrow-down" label={t('manage.moveDown', { name })} size="sm" disabled={!canMoveDown} onPress={() => onMove?.(id, 'down')} />
        </View>
      ) : mode === 'default' && onRemove ? (
        <IconButton icon="circle-minus" label={t('add.removeOne', { name })} color="error" size="sm" onPress={() => onRemove(id)} />
      ) : null}
    </View>
  );
}

export const ParticipantRow = memo(ParticipantRowBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingStart: theme.spacing.lg,
    paddingEnd: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowSelected: { backgroundColor: theme.colors.primarySofter },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm },
  name: { flex: 1 },
  actions: { flexDirection: 'row' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
}));
