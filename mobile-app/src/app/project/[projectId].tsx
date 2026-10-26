import { useLocalSearchParams } from 'expo-router';
import { ProjectEntryScreen } from '@/features/projects/screens/ProjectEntryScreen';

export default function ProjectRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return <ProjectEntryScreen projectId={Number(projectId)} />;
}
