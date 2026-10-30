import type { Metadata } from 'next';
import { NewProjectScreen } from '@/features/projects/components/NewProjectScreen';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return <NewProjectScreen />;
}
