import { notFound } from 'next/navigation';
import { SpinScreen } from '@/features/wheel/components/SpinScreen';

export default async function DrawPage({ params }: PageProps<'/draw/[drawId]'>) {
  const drawId = Number((await params).drawId);
  if (!Number.isInteger(drawId) || drawId < 1) notFound();
  return <SpinScreen drawId={drawId} />;
}
