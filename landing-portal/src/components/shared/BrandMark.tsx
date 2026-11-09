import Image from 'next/image';
import { cn } from '@/lib/utils';

/** The Pickzy logo / brand icon: dark monochrome roulette wheel with pin. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/icon.png"
      alt="Pickzy"
      width={32}
      height={32}
      priority
      className={cn('size-8 object-contain shrink-0 select-none', className)}
    />
  );
}
