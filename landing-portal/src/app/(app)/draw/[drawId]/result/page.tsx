import { notFound } from 'next/navigation';
import { ResultScreen } from '@/features/wheel/components/ResultScreen';

export default async function DrawResultPage({ params }: PageProps<'/draw/[drawId]/result'>) {
  const drawId = Number((await params).drawId);
  if (!Number.isInteger(drawId) || drawId < 1) notFound();
  return <ResultScreen drawId={drawId} />;
}
