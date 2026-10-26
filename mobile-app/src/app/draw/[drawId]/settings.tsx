import { useLocalSearchParams } from 'expo-router';
import { DrawSettingsScreen } from '@/features/wheel/screens/DrawSettingsScreen';

export default function DrawSettingsRoute() {
  const { drawId } = useLocalSearchParams<{ drawId: string }>();
  return <DrawSettingsScreen drawId={Number(drawId)} />;
}
