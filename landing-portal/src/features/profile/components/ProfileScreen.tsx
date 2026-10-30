'use client';

import { WifiOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePreferences } from '../hooks/usePreferences';
import { MAX_DISPLAY_NAME, normalizeDisplayName } from '../services/preferencesService';
import { LanguageSelector } from './LanguageSelector';
import { ProfilePhotoField } from './ProfilePhotoField';
import { ProfileSection } from './ProfileSection';
import { SettingRow } from './SettingRow';
import { ThemeSelector } from './ThemeSelector';

export function ProfileScreen() {
  const { t } = useTranslation(['profile', 'common']);
  const { preferences, saveMany } = usePreferences();
  const [draftName, setDraftName] = useState(preferences.displayName);
  const [saving, setSaving] = useState(false);
  const dirty = normalizeDisplayName(draftName) !== preferences.displayName;

  const guarded = async (work: () => Promise<void>) => {
    try {
      await work();
    } catch {
      toast.error(t('common:errors.saveFailed'));
    }
  };

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    await guarded(async () => {
      const displayName = normalizeDisplayName(draftName);
      await saveMany({ displayName });
      setDraftName(displayName);
      toast.success(t('saved'));
    });
    setSaving(false);
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader title={t('title')} className="mb-0" />

      <ProfileSection title={t('title')}>
        <ProfilePhotoField name={preferences.displayName} photoDataUrl={preferences.photoDataUrl} onChange={(photoDataUrl) => saveMany({ photoDataUrl })} />
        <form onSubmit={(e) => void saveName(e)} className="grid gap-3">
          <FormField id="display-name" label={t('name')}>
            <Input
              id="display-name"
              value={draftName}
              maxLength={MAX_DISPLAY_NAME}
              placeholder={t('namePlaceholder')}
              autoComplete="given-name"
              onChange={(e) => setDraftName(e.target.value)}
              data-testid="display-name"
            />
          </FormField>
          <Button type="submit" disabled={!dirty || saving} className="w-fit" data-testid="save-profile">
            {t('save')}
          </Button>
        </form>
      </ProfileSection>

      <ProfileSection title={t('sectionAppearance')}>
        <ThemeSelector />
      </ProfileSection>

      <ProfileSection title={t('sectionPreferences')}>
        <SettingRow id="language-select" label={t('language')}>
          <LanguageSelector id="language-select" value={preferences.locale} onChange={(locale) => void guarded(() => saveMany({ locale }))} />
        </SettingRow>
        <SettingRow id="confetti-switch" label={t('confetti')} hint={t('confettiHint')}>
          <Switch
            id="confetti-switch"
            checked={preferences.confetti}
            onCheckedChange={(confetti) => void guarded(() => saveMany({ confetti }))}
            data-testid="confetti-switch"
          />
        </SettingRow>
      </ProfileSection>

      <ProfileSection title={t('sectionAbout')}>
        <div className="flex items-start gap-3">
          <WifiOff className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">{t('offline.title')}</p>
            <p className="text-sm text-muted-foreground">{t('offline.message')}</p>
          </div>
        </div>
      </ProfileSection>
    </div>
  );
}
