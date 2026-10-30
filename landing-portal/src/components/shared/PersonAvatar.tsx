import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialOf } from '@/features/participants/services/participantNormalization';
import { wheelPalette } from '@/features/wheel/constants';
import { readableTextColor } from '@/lib/color';
import { cn } from '@/lib/utils';

interface PersonAvatarProps {
  name: string;
  /** Picks the background from the wheel palette so it matches the wheel segment. */
  colorIndex?: number;
  imageUrl?: string | null;
  className?: string;
}

export function PersonAvatar({ name, colorIndex = 0, imageUrl, className }: PersonAvatarProps) {
  const bg = wheelPalette[colorIndex % wheelPalette.length];
  return (
    <Avatar className={cn('size-9', className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback style={{ backgroundColor: bg, color: readableTextColor(bg) }} className="font-semibold" aria-hidden>
        {name.trim() ? initialOf(name) : <User className="size-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
