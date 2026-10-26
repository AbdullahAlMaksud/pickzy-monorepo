import { useLocalSearchParams } from 'expo-router';
import { ResultScreen } from '@/features/wheel/screens/ResultScreen';

export default function ResultRoute() {
  const { drawId } = useLocalSearchParams<{ drawId: string }>();
  return <ResultScreen drawId={Number(drawId)} />;
}
