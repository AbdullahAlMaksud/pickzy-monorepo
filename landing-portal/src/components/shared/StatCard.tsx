import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="items-center gap-1 p-4 text-center">
      <Icon className="size-5 text-primary" aria-hidden />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
