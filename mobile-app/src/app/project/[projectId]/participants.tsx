import { useLocalSearchParams } from 'expo-router';
import { ParticipantsScreen } from '@/features/participants/screens/ParticipantsScreen';

export default function ParticipantsRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return <ParticipantsScreen projectId={Number(projectId)} />;
}
