'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useServices } from '@/lib/services-context';
import { notifyDataChanged } from '@/store/appStore';
import { durations } from '../constants';
import type { SpinWheelHandle } from '../components/SpinWheel';
import { createSpinPlan, normalizeDegrees } from '../services/wheelGeometry';
import { createDefaultRng, getEligibleParticipants, normalizeRules } from '../services/winnerSelection';
import type { DrawParticipant, DrawSnapshot, DrawWinnerWithName, WheelPhase } from '../types';

export interface Reveal {
  winner: DrawWinnerWithName;
  /** 1-based place of this winner. */
  order: number;
  /** How many winners the draw asked for when this one was drawn. */
  requested: number;
  /** The wheel's segments when this winner was drawn. */
  pool: DrawParticipant[];
}

interface Options {
  drawId: number;
  snapshot: DrawSnapshot | null;
  wheelRef: RefObject<SpinWheelHandle | null>;
  reload: () => void;
  onError: (error: unknown) => void;
}

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Coordinates "pick the winner (saved) -> animate to it -> reveal".
 *
 * The winner is chosen and stored by `DrawSessionService.spin()` BEFORE any animation starts; the
 * wheel only shows an already-saved result. If the page is closed at any point, the saved but not yet
 * acknowledged winner is shown again the next time the draw opens.
 */
export function useSpinController({ drawId, snapshot, wheelRef, reload, onError }: Options) {
  const { draws } = useServices();
  const [phase, setPhase] = useState<WheelPhase>('idle');
  const [spinReveal, setSpinReveal] = useState<Reveal | null>(null);
  const [frozenItems, setFrozenItems] = useState<DrawParticipant[]>([]);
  const [acknowledged, setAcknowledged] = useState<readonly number[]>([]);
  const busy = useRef(false); // synchronous double-click guard (state updates are asynchronous)
  const rng = useRef(createDefaultRng());
  const target = useRef<number | null>(null);

  // Everyone who can still be drawn.
  const eligible = useMemo(() => {
    if (!snapshot) return [];
    return getEligibleParticipants(snapshot.participants, snapshot.winners.map((w) => w.drawParticipantId), normalizeRules(snapshot.session));
  }, [snapshot]);

  // A winner that was saved but never acknowledged (page closed or reloaded mid-reveal).
  const restored = useMemo<Reveal | null>(() => {
    if (!snapshot || phase !== 'idle' || spinReveal) return null;
    const unrevealed = snapshot.winners.find((w) => w.revealedAt === null && !acknowledged.includes(w.id));
    if (!unrevealed) return null;
    const rules = normalizeRules(snapshot.session);
    const earlier = snapshot.winners.filter((w) => w.winnerOrder < unrevealed.winnerOrder).map((w) => w.drawParticipantId);
    const pool = getEligibleParticipants(snapshot.participants, earlier, rules);
    return { winner: unrevealed, order: unrevealed.winnerOrder, requested: rules.requestedWinnerCount, pool };
  }, [snapshot, phase, spinReveal, acknowledged]);

  const revealing = spinReveal ?? restored;
  const wheelItems = revealing ? revealing.pool : phase === 'idle' ? eligible : frozenItems;

  // Put the pointer on the restored winner (no animation).
  const restoredId = restored?.winner.id;
  useEffect(() => {
    if (!restored) return;
    const index = restored.pool.findIndex((p) => p.id === restored.winner.drawParticipantId);
    if (index < 0) return;
    const plan = createSpinPlan({ currentRotation: 0, winnerIndex: index, segmentCount: restored.pool.length, rng: () => 0.5, reducedMotion: true });
    wheelRef.current?.jumpTo(normalizeDegrees(plan.targetRotation));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a different winner is restored
  }, [restoredId]);

  const spin = useCallback(async () => {
    if (busy.current || phase !== 'idle' || revealing) return;
    busy.current = true;
    setPhase('selecting');
    try {
      const outcome = await draws.spin(drawId); // the winner is saved here
      const wheel = wheelRef.current;
      if (!wheel) {
        // Left the page while selecting: the winner is saved and will be restored on return.
        busy.current = false;
        setPhase('idle');
        return;
      }
      setFrozenItems(outcome.pool);
      const reducedMotion = prefersReducedMotion();
      const plan = createSpinPlan({
        currentRotation: normalizeDegrees(wheel.getRotation()),
        winnerIndex: outcome.poolIndex,
        segmentCount: outcome.pool.length,
        rng: rng.current,
        reducedMotion,
      });
      wheel.jumpTo(normalizeDegrees(wheel.getRotation()));
      target.current = plan.targetRotation;
      setPhase('spinning');
      wheel.spinTo(plan.targetRotation, reducedMotion ? durations.spinReduced : durations.spin, () => {
        busy.current = false;
        target.current = null;
        wheel.jumpTo(normalizeDegrees(plan.targetRotation)); // same picture, smaller number
        setSpinReveal({ winner: outcome.winner, order: outcome.order, requested: outcome.requested, pool: outcome.pool });
        setPhase('revealing');
        reload();
      });
    } catch (error) {
      busy.current = false;
      setPhase('idle');
      onError(error);
      reload();
    }
  }, [draws, drawId, onError, phase, reload, revealing, wheelRef]);

  // Coming back to the tab mid-spin: finish at the final position right away.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && target.current !== null) wheelRef.current?.finishNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [wheelRef]);

  /** The person saw the winner: remember that, then return the wheel to idle. */
  const acknowledge = useCallback(async () => {
    if (!revealing) return;
    const id = revealing.winner.id;
    await draws.acknowledgeWinner(id);
    setAcknowledged((ids) => [...ids, id]);
    setSpinReveal(null);
    setPhase('idle');
    reload();
    notifyDataChanged();
  }, [draws, reload, revealing]);

  return { phase, revealing, wheelItems, eligible, spin, acknowledge };
}
