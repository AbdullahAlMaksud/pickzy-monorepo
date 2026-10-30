import { Loader2 } from 'lucide-react';

/** Full-page spinner used before the database is ready. Deliberately text-free (no language yet). */
export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-busy="true">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
