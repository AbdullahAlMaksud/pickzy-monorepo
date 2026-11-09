import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans-bengali';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: { default: 'Pickzy', template: '%s · Pickzy' },
  description: 'Offline-first random winner picker. Add names, spin the wheel, keep a history of every draw.',
  applicationName: 'Pickzy',
  icons: {
    icon: '/images/icon.png',
    shortcut: '/images/icon.png',
    apple: '/images/icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
