import { useLocalSearchParams } from 'expo-router';
import { HistoryDetailScreen } from '@/features/history/screens/HistoryDetailScreen';

export default function HistoryDetailRoute() {
  const { historyId } = useLocalSearchParams<{ historyId: string }>();
  return <HistoryDetailScreen historyId={Number(historyId)} />;
}
