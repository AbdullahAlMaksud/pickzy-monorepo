import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { useLocale } from '@/hooks/useLocale';
import type { ProjectSummary } from '@/database/repositories/projectRepository';

interface Props {
  project: ProjectSummary;
  colorIndex: number;
  onPress: (projectId: number) => void;
}

/** A project row: colored initial avatar, name, date line, participant count and last winner. */
function ProjectListItemBase({ project, colorIndex, onPress }: Props) {
  const { t } = useTranslation(['home', 'common']);
  const { relativeDateTime } = useLocale();
  return (
    <Pressable
      testID={`project-${project.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('home:project.open', { name: project.name })}
      onPress={() => onPress(project.id)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar name={project.name} size={44} colorIndex={colorIndex} />
      <View style={styles.text}>
        <AppText variant="label" weight="semibold" numberOfLines={1}>
          {project.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {relativeDateTime(project.updatedAt)} · {t('common:participants', { count: project.participantCount })}
        </AppText>
      </View>
      {project.lastWinnerName ? (
        <View style={styles.winner}>
          <AppText variant="micro" tone="muted">
            {t('home:project.lastWinner', { name: '' }).replace(/[:：]\s*$/, '')}
          </AppText>
          <AppText variant="label" weight="semibold" tone="primary" numberOfLines={1}>
            {project.lastWinnerName}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

export const ProjectListItem = memo(ProjectListItemBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 64,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  pressed: { opacity: 0.85 },
  text: { flex: 1, gap: 2 },
  winner: { maxWidth: 110, alignItems: 'flex-end', gap: 1 },
}));
