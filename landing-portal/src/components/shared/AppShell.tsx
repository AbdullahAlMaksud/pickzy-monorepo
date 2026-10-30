'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, FolderOpen, Home, User, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';

interface NavItem {
  href: string;
  labelKey: 'home' | 'projects' | 'history' | 'profile';
  icon: LucideIcon;
  /** Pathname prefixes that keep this item highlighted. */
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', labelKey: 'home', icon: Home, match: (p) => p === '/' },
  { href: '/projects', labelKey: 'projects', icon: FolderOpen, match: (p) => p.startsWith('/projects') },
  { href: '/history', labelKey: 'history', icon: Clock, match: (p) => p.startsWith('/history') },
  { href: '/profile', labelKey: 'profile', icon: User, match: (p) => p.startsWith('/profile') },
];

/** Page frame: top bar with navigation on large screens, bottom tab bar on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation('common');
  const items = NAV_ITEMS.map((item) => ({ ...item, label: t(`tabs.${item.labelKey}`), active: item.match(pathname) }));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary" aria-label={t('appName')}>
            <BrandMark />
            <span className="text-lg tracking-tight">{t('appName')}</span>
          </Link>
          <nav aria-label={t('appName')} className="ml-auto hidden gap-1 md:flex">
            {items.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-10">{children}</main>

      <nav
        aria-label={t('appName')}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-xs font-medium',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
