'use client';

import { Camera, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Button } from '@/components/ui/button';
import { fileToAvatarDataUrl } from '../services/photoService';

interface ProfilePhotoFieldProps {
  name: string;
  photoDataUrl: string | null;
  /** Saves the new photo (or `null` to remove it). Throws when saving fails. */
  onChange: (photo: string | null) => Promise<void>;
}

export function ProfilePhotoField({ name, photoDataUrl, onChange }: ProfilePhotoFieldProps) {
  const { t } = useTranslation('profile');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const result = await fileToAvatarDataUrl(file);
    if (result.status !== 'ok') return void toast.error(t('photoError'));
    try {
      await onChange(result.dataUrl);
      toast.success(t('photoUpdated'));
    } catch {
      toast.error(t('photoError'));
    }
  };

  const remove = async () => {
    try {
      await onChange(null);
      toast.success(t('photoRemoved'));
    } catch {
      toast.error(t('photoError'));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <PersonAvatar name={name} imageUrl={photoDataUrl} className="size-20 text-2xl" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} data-testid="photo-change">
          <Camera aria-hidden />
          {t('changePhoto')}
        </Button>
        {photoDataUrl ? (
          <Button type="button" variant="ghost" onClick={() => void remove()} data-testid="photo-remove">
            <Trash2 aria-hidden />
            {t('removePhoto')}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label={t('changePhoto')}
        data-testid="photo-input"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = ''; // lets the same file be chosen again
        }}
      />
    </div>
  );
}
