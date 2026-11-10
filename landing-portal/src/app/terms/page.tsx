import type { Metadata } from 'next';
import { TermsPage } from '@/features/terms/components/TermsPage';

export const metadata: Metadata = {
  title: 'Terms of Service · Pickzy',
  description:
    'Terms of Service and ethical use pledge for Pickzy, the offline-first random winner picker and raffle wheel.',
};

export default function Page() {
  return <TermsPage />;
}

