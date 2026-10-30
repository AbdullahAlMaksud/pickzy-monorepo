'use client';

import { Monitor, Moon, Palette, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { THEME_PREFERENCES, type ThemePreference } from '../types';

const ICONS: Record<ThemePreference, LucideIcon> = { system: Monitor, light: Sun, dark: Moon, colorful: Palette };
const subscribe = () => () => {};

/** Four theme cards. The theme is stored by next-themes (localStorage), so it applies before React loads. */
export function ThemeSelector() {
  const { t } = useTranslation('profile');
  const { theme, setTheme } = useTheme();
  // next-themes only knows the saved theme on the client; show nothing selected until then.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const value = mounted ? (theme ?? 'system') : '';

  return (
    <RadioGroup value={value} onValueChange={setTheme} aria-label={t('theme')} className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="theme-selector">
      {THEME_PREFERENCES.map((id) => {
        const Icon = ICONS[id];
        return (
          <label
            key={id}
            htmlFor={`theme-${id}`}
            className={cn(
              'flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 transition-colors hover:border-primary/50',
              'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
              value === id && 'border-primary bg-secondary',
            )}
          >
            <div className="flex w-full items-center justify-between">
              <Icon className="size-5 text-primary" aria-hidden />
              <RadioGroupItem id={`theme-${id}`} value={id} />
            </div>
            <span className="font-semibold">{t(`themes.${id}.name`)}</span>
            <span className="text-xs text-muted-foreground">{t(`themes.${id}.hint`)}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
