import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  /** Usually a Button. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center', className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {message ? <p className="max-w-md text-muted-foreground">{message}</p> : null}
      {action}
    </div>
  );
}
