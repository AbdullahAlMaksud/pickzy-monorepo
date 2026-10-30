import { Skeleton } from '@/components/ui/skeleton';

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
