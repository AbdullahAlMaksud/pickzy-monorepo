import { useLocalSearchParams } from 'expo-router';
import { SpinScreen } from '@/features/wheel/screens/SpinScreen';

export default function DrawRoute() {
  const { drawId } = useLocalSearchParams<{ drawId: string }>();
  return <SpinScreen drawId={Number(drawId)} />;
}
