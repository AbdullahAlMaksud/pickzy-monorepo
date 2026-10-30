import { notFound } from 'next/navigation';
import { HistoryDetailScreen } from '@/features/history/components/HistoryDetailScreen';

export default async function HistoryDetailPage({ params }: PageProps<'/history/[historyId]'>) {
  const historyId = Number((await params).historyId);
  if (!Number.isInteger(historyId) || historyId < 1) notFound();
  return <HistoryDetailScreen historyId={historyId} />;
}
