import { useCallback, type ReactElement } from 'react';
import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ParticipantRow, type ParticipantId, type ParticipantMode } from './ParticipantRow';

export interface ParticipantItem {
  id: ParticipantId;
  name: string;
}

interface ParticipantListProps {
  items: readonly ParticipantItem[];
  mode?: ParticipantMode;
  selectedIds?: ReadonlySet<ParticipantId>;
  header?: ReactElement | null;
  empty?: ReactElement | null;
  footerSpace?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onRemove?: (id: ParticipantId) => void;
  onEdit?: (id: ParticipantId) => void;
  onMove?: (id: ParticipantId, direction: 'up' | 'down') => void;
  onToggleSelect?: (id: ParticipantId) => void;
}

const EMPTY_SET: ReadonlySet<ParticipantId> = new Set();

/**
 * The scrolling container for a participants screen. It is a virtualized FlatList (the form lives in
 * `header`), so thousands of imported names stay smooth.
 */
export function ParticipantList({
  items,
  mode = 'default',
  selectedIds = EMPTY_SET,
  header,
  empty,
  footerSpace = 24,
  contentContainerStyle,
  onRemove,
  onEdit,
  onMove,
  onToggleSelect,
}: ParticipantListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: ParticipantItem; index: number }) => (
      <View style={styles.rowWrap}>
        <ParticipantRow
          id={item.id}
          name={item.name}
          index={index}
          mode={mode}
          selected={selectedIds.has(item.id)}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
          onRemove={onRemove}
          onEdit={onEdit}
          onMove={onMove}
          onToggleSelect={onToggleSelect}
        />
      </View>
    ),
    [items.length, mode, selectedIds, onRemove, onEdit, onMove, onToggleSelect],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      extraData={selectedIds}
      ListHeaderComponent={header ?? undefined}
      ListEmptyComponent={empty ?? undefined}
      ListFooterComponent={<View style={{ height: footerSpace }} />}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={14}
      maxToRenderPerBatch={16}
      windowSize={9}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  rowWrap: { overflow: 'hidden' },
}));
