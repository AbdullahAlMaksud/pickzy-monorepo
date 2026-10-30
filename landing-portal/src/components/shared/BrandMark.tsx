import { cn } from '@/lib/utils';
import { wheelPalette } from '@/features/wheel/constants';

/** The Pickzy logo: a small colorful wheel with a pointer. Decorative (the wordmark names the app). */
export function BrandMark({ className }: { className?: string }) {
  const slices = wheelPalette.slice(0, 6);
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden focusable="false">
      <g transform="translate(16 17)">
        {slices.map((color, i) => {
          const a0 = (i * 60 - 90) * (Math.PI / 180);
          const a1 = ((i + 1) * 60 - 90) * (Math.PI / 180);
          const r = 12;
          return (
            <path
              key={color}
              d={`M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`}
              fill={color}
            />
          );
        })}
        <circle r="3.2" fill="white" />
      </g>
      <path d="M16 1.5 L19.5 7.5 L12.5 7.5 Z" fill="currentColor" />
    </svg>
  );
}
