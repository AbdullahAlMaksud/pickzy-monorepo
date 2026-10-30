'use client';

import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { readableTextColor } from '@/lib/color';
import { wheelPalette } from '../constants';
import type { DrawParticipant } from '../types';
import { computeLabelLayout, segmentAngle, segmentCenterAngle, segmentPath, truncateLabel } from '../services/wheelGeometry';
import { segmentColorIndex } from '../services/wheelColors';

export interface SpinWheelHandle {
  /** Animate to an absolute rotation (degrees). Calls `onFinished` exactly once when it ends. */
  spinTo(targetRotation: number, durationMs: number, onFinished: () => void): void;
  /** Jump to a rotation without animating (restoring a saved result). */
  jumpTo(rotation: number): void;
  /** Stop at the final rotation right now (the tab was in the background while the wheel spun). */
  finishNow(): void;
  getRotation(): number;
}

interface SpinWheelProps {
  items: readonly DrawParticipant[];
  spinLabel: string;
  spinDisabled: boolean;
  onSpinClick: () => void;
}

/** The wheel is drawn in a fixed 360 x 360 coordinate system and scaled to the container with CSS. */
const VIEW = 360;
const RADIUS = VIEW / 2;
const RIM = 12;
const DISC = RADIUS - RIM;
const SPIN_EASING = 'cubic-bezier(0.17, 0.67, 0.12, 0.99)'; // lurches into motion, coasts to a stop

function SpinWheelBase({ items, spinLabel, spinDisabled, onSpinClick }: SpinWheelProps, ref: React.Ref<SpinWheelHandle>) {
  const { t, i18n } = useTranslation('wheel');
  const count = items.length;
  const discRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const pending = useRef<{ done: () => void; timer: ReturnType<typeof setTimeout> } | null>(null);

  const settle = useCallback(() => {
    const current = pending.current;
    if (!current) return;
    pending.current = null;
    clearTimeout(current.timer);
    current.done();
  }, []);

  const apply = useCallback((value: number, durationMs: number) => {
    const el = discRef.current;
    if (!el) return;
    rotation.current = value;
    el.style.transition = durationMs > 0 ? `transform ${durationMs}ms ${SPIN_EASING}` : 'none';
    el.style.transform = `rotate(${value}deg)`;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      spinTo(targetRotation, durationMs, onFinished) {
        const el = discRef.current;
        if (!el) return;
        if (pending.current) clearTimeout(pending.current.timer);
        void el.offsetWidth; // commit the starting position before the transition begins
        // `transitionend` can be skipped (hidden tab, reduced motion): the timer is the safety net.
        const timer = setTimeout(settle, durationMs + 300);
        pending.current = { done: onFinished, timer };
        apply(targetRotation, durationMs);
      },
      jumpTo(value) {
        if (pending.current) clearTimeout(pending.current.timer);
        pending.current = null;
        apply(value, 0);
      },
      finishNow() {
        const el = discRef.current;
        if (el) {
          el.style.transition = 'none';
          el.style.transform = `rotate(${rotation.current}deg)`;
        }
        settle();
      },
      getRotation: () => rotation.current,
    }),
    [apply, settle],
  );

  const layout = useMemo(() => computeLabelLayout(count, DISC), [count]);
  const bn = i18n.language?.startsWith('bn');

  const artwork = useMemo(() => {
    const seg = segmentAngle(Math.max(count, 1));
    return (
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="size-full" aria-hidden focusable="false">
        <circle cx={RADIUS} cy={RADIUS} r={RADIUS - RIM / 2} className="fill-stage" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = ((i * 15 - 90) * Math.PI) / 180;
          const rr = RADIUS - RIM / 2;
          return <circle key={i} cx={RADIUS + rr * Math.cos(a)} cy={RADIUS + rr * Math.sin(a)} r={1.8} fill={i % 2 === 0 ? '#fff' : '#b9b3e6'} opacity={0.85} />;
        })}
        {items.map((item, i) => {
          const fill = wheelPalette[segmentColorIndex(i, count, wheelPalette.length)];
          const center = segmentCenterAngle(i, count);
          return (
            <g key={item.id}>
              <path d={segmentPath(RADIUS, RADIUS, DISC, i * seg, (i + 1) * seg)} fill={fill} stroke="rgba(255,255,255,0.55)" strokeWidth={count > 1 ? 1 : 0} />
              {layout.visible ? (
                <text
                  transform={`rotate(${center - 90} ${RADIUS} ${RADIUS})`}
                  x={RADIUS + DISC - 12}
                  y={RADIUS}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={readableTextColor(fill)}
                  fontSize={layout.fontSize}
                  fontWeight={600}
                >
                  {truncateLabel(item.displayName, layout.maxChars)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    );
  }, [items, count, layout]);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[480px]"
      role="img"
      aria-label={t('wheelLabel', { count })}
      data-testid="spin-wheel"
      data-bn={bn ? '' : undefined}
    >
      <div ref={discRef} className="size-full will-change-transform" onTransitionEnd={(e) => e.target === e.currentTarget && settle()}>
        {artwork}
      </div>

      {/* Pointer: fixed at 12 o'clock while the wheel turns beneath it. */}
      <svg viewBox="0 0 40 48" className="pointer-events-none absolute -top-2 left-1/2 w-[9%] -translate-x-1/2 drop-shadow-md" aria-hidden focusable="false">
        <path d="M20 46 L3 8 A19 19 0 0 1 37 8 Z" fill="#fff" stroke="#f2557a" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="20" cy="14" r="5" fill="#f2557a" />
      </svg>

      <button
        type="button"
        onClick={onSpinClick}
        disabled={spinDisabled}
        aria-label={spinLabel}
        data-testid="wheel-center-button"
        className="absolute top-1/2 left-1/2 flex aspect-square w-[27%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-center text-[clamp(0.7rem,2.6vw,1rem)] leading-tight font-bold tracking-wide text-primary uppercase shadow-lg ring-4 ring-primary/30 transition-transform outline-none hover:scale-105 focus-visible:ring-primary disabled:scale-100 disabled:opacity-80"
      >
        {spinLabel}
      </button>
    </div>
  );
}

export const SpinWheel = memo(forwardRef(SpinWheelBase));
