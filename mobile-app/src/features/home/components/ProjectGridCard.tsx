import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import type { ProjectSummary } from '@/database/repositories/projectRepository';

interface ProjectGridCardProps {
  project: ProjectSummary;
  colorIndex: number;
  onPress: (projectId: number) => void;
  style?: object;
}

function ProjectGridCardBase({ project, colorIndex, onPress, style }: ProjectGridCardProps) {
  const { t } = useTranslation(['home', 'common']);

  return (
    <Pressable
      testID={`project-grid-${project.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('home:project.open', { name: project.name })}
      onPress={() => onPress(project.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.topRow}>
        <Avatar name={project.name} size={36} colorIndex={colorIndex} shape="squircle" />
        <Icon name="arrow-right" size="xs" color="textSecondary" />
      </View>

      <View style={styles.content}>
        <AppText variant="label" weight="bold" tone="text" numberOfLines={2} style={styles.name}>
          {project.name}
        </AppText>
      </View>

      <View style={styles.bottomRow}>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {t('common:participants', { count: project.participantCount })}
        </AppText>
      </View>
    </Pressable>
  );
}

export const ProjectGridCard = memo(ProjectGridCardBase);

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: 124,
    justifyContent: 'space-between',
    ...theme.shadows.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  name: {
    color: theme.colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}));

