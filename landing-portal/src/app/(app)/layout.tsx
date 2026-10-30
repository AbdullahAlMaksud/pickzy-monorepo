import { AppShell } from '@/components/shared/AppShell';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>;
}
