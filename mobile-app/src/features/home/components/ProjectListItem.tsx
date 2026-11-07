import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/hooks/useLocale';
import type { ProjectSummary } from '@/database/repositories/projectRepository';

interface Props {
  project: ProjectSummary;
  colorIndex: number;
  onPress: (projectId: number) => void;
}

/** Decorative hand-drawn style accent lines for avatar (as seen in mockup) */
function SparkleAccent() {
  return (
    <View style={styles.sparkle} pointerEvents="none">
      <View style={[styles.sparkleLine, styles.sparkleLine1]} />
      <View style={[styles.sparkleLine, styles.sparkleLine2]} />
      <View style={[styles.sparkleLine, styles.sparkleLine3]} />
    </View>
  );
}

/** A project row: squircle initial avatar, name, date line, participant count, last winner pill, and arrow. */
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
      <View style={styles.avatarWrapper}>
        <Avatar name={project.name} size={46} colorIndex={colorIndex} shape="squircle" />
        <SparkleAccent />
      </View>
      <View style={styles.text}>
        <AppText variant="label" weight="bold" tone="text" numberOfLines={1}>
          {project.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.dateText}>
          {relativeDateTime(project.updatedAt)} · {t('common:participants', { count: project.participantCount })}
        </AppText>
      </View>
      {project.lastWinnerName ? (
        <View style={styles.winnerSection}>
          <View style={styles.winnerPill}>
            <AppText variant="micro" tone="secondary" weight="medium">
              {t('home:project.lastWinner', { name: '' }).replace(/[:：]\s*$/, '')}
            </AppText>
          </View>
          <AppText variant="label" weight="bold" tone="text" numberOfLines={1} style={styles.winnerName}>
            {project.lastWinnerName}
          </AppText>
        </View>
      ) : null}
      <Icon name="arrow-right" size="sm" color="textSecondary" />
    </Pressable>
  );
}

export const ProjectListItem = memo(ProjectListItemBase);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 72,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  pressed: { opacity: 0.88 },
  avatarWrapper: {
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    top: -5,
    right: -7,
    width: 14,
    height: 14,
  },
  sparkleLine: {
    position: 'absolute',
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 1,
  },
  sparkleLine1: {
    width: 5,
    height: 1.5,
    top: 2,
    right: 6,
    transform: [{ rotate: '-35deg' }],
  },
  sparkleLine2: {
    width: 6,
    height: 1.5,
    top: 5,
    right: 1,
    transform: [{ rotate: '15deg' }],
  },
  sparkleLine3: {
    width: 5,
    height: 1.5,
    top: 9,
    right: 4,
    transform: [{ rotate: '55deg' }],
  },
  text: { flex: 1, gap: 3 },
  dateText: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  winnerSection: {
    alignItems: 'flex-end',
    gap: 3,
    marginRight: 2,
  },
  winnerPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  winnerName: {
    fontSize: 13,
  },
}));
