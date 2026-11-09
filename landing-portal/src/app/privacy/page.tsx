import type { Metadata } from 'next';
import { PrivacyPage } from '@/features/privacy/components/PrivacyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy · Pickzy',
  description: 'Pickzy is an offline-first random winner picker. We do not track, collect, or transmit your personal data.',
};

export default function Page() {
  return <PrivacyPage />;
}

