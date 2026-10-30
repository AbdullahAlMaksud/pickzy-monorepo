import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Filled with the primary color for the main call to action. */
  highlighted?: boolean;
  testId?: string;
}

/** A large tappable card that links somewhere (home screen shortcuts). */
export function ActionCard({ href, icon: Icon, title, subtitle, highlighted, testId }: ActionCardProps) {
  return (
    <Link href={href} data-testid={testId} className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <Card
        className={cn(
          'flex-row items-center gap-4 p-5 transition-colors',
          highlighted ? 'border-transparent bg-primary text-primary-foreground' : 'group-hover:border-primary/50',
        )}
      >
        <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', highlighted ? 'bg-white/20' : 'bg-secondary text-primary')}>
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className={cn('text-sm', highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{subtitle}</p>
        </div>
        <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
      </Card>
    </Link>
  );
}
