import { Crown } from 'lucide-react';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WinnerCardProps {
  name: string;
  /** e.g. "1st place". */
  positionLabel: string;
  colorIndex: number;
  className?: string;
  testId?: string;
}

/** One winner: avatar, place and name. Used on the wheel page, the result page and in History. */
export function WinnerCard({ name, positionLabel, colorIndex, className, testId }: WinnerCardProps) {
  return (
    <Card className={cn('flex-row items-center gap-3 p-3', className)} data-testid={testId}>
      <PersonAvatar name={name} colorIndex={colorIndex} className="size-11" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{positionLabel}</p>
        <p className="truncate font-semibold" title={name}>
          {name}
        </p>
      </div>
      <Crown className="size-5 text-gold" aria-hidden />
    </Card>
  );
}
