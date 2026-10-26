import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { useLocale } from '@/hooks/useLocale';
import type { HistoryListItem } from '@/database/repositories/historyRepository';

const NAME_PREVIEW = 2;

interface Props {
  item: HistoryListItem;
  colorIndex: number;
  onPress: (id: number) => void;
}

function HistoryItemBase({ item, colorIndex, onPress }: Props) {
  const { t } = useTranslation(['history', 'common']);
  const { dateTime } = useLocale();
  const shown = item.winnerNames.slice(0, NAME_PREVIEW);
  const extra = item.winnerNames.length - shown.length;
  const names = shown.join(', ');
  const winnerLine = `${item.winnerNames.length === 1 ? t('item.winner', { names }) : t('item.winners', { names })}${
    extra > 0 ? ` ${t('item.more', { count: extra })}` : ''
  }`;

  return (
    <Pressable
      testID={`history-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('item.open', { name: item.projectName })}
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar name={item.projectName} size={44} colorIndex={colorIndex} />
      <View style={styles.text}>
        <AppText variant="label" weight="semibold" numberOfLines={1}>
          {item.projectName}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {dateTime(item.completedAt)}
        </AppText>
        <AppText variant="caption" tone="primary" weight="medium" numberOfLines={2}>
          {winnerLine}
        </AppText>
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" tone="secondary">
          {t('common:participants', { count: item.participantCount })}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('common:winners', { count: item.winnerCount })}
        </AppText>
      </View>
    </Pressable>
  );
}

export const HistoryItem = memo(HistoryItemBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: 2 },
  meta: { alignItems: 'flex-end', gap: 2, maxWidth: 110 },
}));
