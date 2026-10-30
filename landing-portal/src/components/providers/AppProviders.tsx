'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { AppBootstrap } from '@/features/app/AppBootstrap';
import { LanguageSync } from '@/features/app/LanguageSync';

export const THEMES = ['light', 'dark', 'colorful'] as const;

/** Every client-side provider the app needs, in one place (used by the root layout). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" themes={[...THEMES]} defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppBootstrap>
        <LanguageSync />
        {children}
      </AppBootstrap>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}
