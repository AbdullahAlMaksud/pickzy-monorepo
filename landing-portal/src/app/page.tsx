import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/components/LandingPage';

export const metadata: Metadata = {
  title: 'Pickzy · Fair & Fast Offline-First Winner Picker',
  description:
    'Modern random winner picker and raffle wheel for events, giveaways, and classrooms. 100% offline-first, cryptographic fairness, and multi-winner support.',
};

export default function Page() {
  return <LandingPage />;
}

