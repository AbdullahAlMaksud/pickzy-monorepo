import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useServices } from '@/services/ServicesProvider';
import { notifyDataChanged } from '@/store/appStore';
import { useDrawSessionStore } from '@/store/drawSessionStore';
import { durations } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';
import type { SpinWheelHandle } from '../components/SpinWheel';
import { createSpinPlan, normalizeDegrees } from '../services/wheelGeometry';
import { createDefaultRng, getEligibleParticipants, normalizeRules } from '../services/winnerSelection';
import type { DrawSnapshot } from '../types';

interface Pending {
  winnerId: number;
  targetRotation: number;
}

interface Options {
  drawId: number;
  snapshot: DrawSnapshot | null;
  wheelRef: React.RefObject<SpinWheelHandle | null>;
  reload: () => Promise<DrawSnapshot | null>;
  onError: (error: unknown) => void;
}

/**
 * Coordinates "pick winner (saved) → animate to it → reveal".
 *
 * The winner is chosen and persisted by `DrawSessionService.spin()` BEFORE any animation starts; the
 * wheel only visualizes that already-saved result. If the app is interrupted at any point, the saved
 * but unacknowledged winner is restored and shown again the next time the draw opens.
 */
export function useSpinController({ drawId, snapshot, wheelRef, reload, onError }: Options) {
  const { draws } = useServices();
  const reducedMotion = useReducedMotion();
  const store = useDrawSessionStore;
  const phase = useDrawSessionStore((s) => s.phase);
  const revealing = useDrawSessionStore((s) => s.revealing);
  const frozenItems = useDrawSessionStore((s) => s.wheelItems);

  const busyRef = useRef(false); // synchronous double-tap guard (state updates are async)
  const pendingRef = useRef<Pending | null>(null);
  const rngRef = useRef(createDefaultRng());
  const completeRef = useRef<(() => void) | null>(null);

  // What the wheel shows while idle: everyone who can still be drawn.
  const eligible = useMemo(() => {
    if (!snapshot) return [];
    return getEligibleParticipants(
      snapshot.participants,
      snapshot.winners.map((w) => w.drawParticipantId),
      normalizeRules(snapshot.session),
    );
  }, [snapshot]);

  const wheelItems = phase === 'idle' && !revealing ? eligible : frozenItems;

  const finishSpin = useCallback(
    (winnerId: number, order: number, requested: number, name: string) => {
      const wheel = wheelRef.current;
      if (wheel) wheel.jumpTo(normalizeDegrees(wheel.getRotation())); // same picture, smaller number
      pendingRef.current = null;
      store.getState().setRevealing({
        winner: {
          id: winnerId,
          drawSessionId: drawId,
          drawParticipantId: 0,
          winnerOrder: order,
          selectedAt: Date.now(),
          revealedAt: null,
          displayName: name,
        },
        order,
        requested,
      });
      store.getState().setPhase('revealing');
      haptic.heavy();
    },
    [drawId, store, wheelRef],
  );

  const spin = useCallback(async () => {
    if (busyRef.current || store.getState().phase !== 'idle') return;
    busyRef.current = true;
    store.getState().setPhase('selecting');
    try {
      const outcome = await draws.spin(drawId); // winner is saved here
      const wheel = wheelRef.current;
      if (!wheel) {
        // Screen left while selecting: the winner is saved and will be restored on return.
        busyRef.current = false;
        store.getState().setPhase('idle');
        return;
      }
      store.getState().setWheelItems(outcome.pool);
      const plan = createSpinPlan({
        currentRotation: normalizeDegrees(wheel.getRotation()),
        winnerIndex: outcome.poolIndex,
        segmentCount: outcome.pool.length,
        rng: rngRef.current,
        reducedMotion,
      });
      wheel.jumpTo(normalizeDegrees(wheel.getRotation()));
      pendingRef.current = { winnerId: outcome.winner.id, targetRotation: plan.targetRotation };
      store.getState().setPhase('spinning');
      let done = false;
      const complete = () => {
        if (done) return;
        done = true;
        busyRef.current = false;
        finishSpin(outcome.winner.id, outcome.order, outcome.requested, outcome.winner.displayName);
      };
      completeRef.current = complete;
      wheel.spinTo(plan.targetRotation, reducedMotion ? durations.spinReduced : durations.spin, complete);
    } catch (error) {
      busyRef.current = false;
      store.getState().setPhase('idle');
      onError(error);
      await reload();
    }
  }, [draws, drawId, finishSpin, onError, reducedMotion, reload, store, wheelRef]);

  // Returning from the background mid-spin: jump to the final position and reveal, exactly once.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const pending = pendingRef.current;
      if (store.getState().phase === 'spinning' && pending) {
        wheelRef.current?.finishNow(pending.targetRotation);
        completeRef.current?.();
      }
    });
    return () => subscription.remove();
  }, [store, wheelRef]);

  // Restore a winner that was saved but never acknowledged (app killed or screen left mid-reveal).
  useEffect(() => {
    if (!snapshot || store.getState().phase !== 'idle' || store.getState().revealing) return;
    const unrevealed = snapshot.winners.find((w) => w.revealedAt === null);
    if (!unrevealed) return;
    const rules = normalizeRules(snapshot.session);
    const earlier = snapshot.winners.filter((w) => w.winnerOrder < unrevealed.winnerOrder).map((w) => w.drawParticipantId);
    const pool = getEligibleParticipants(snapshot.participants, earlier, rules);
    const index = pool.findIndex((p) => p.id === unrevealed.drawParticipantId);
    if (index < 0) return;
    store.getState().setWheelItems(pool);
    const plan = createSpinPlan({ currentRotation: 0, winnerIndex: index, segmentCount: pool.length, rng: () => 0.5, reducedMotion: true });
    // wheel is mounted by the time this runs (snapshot exists); jump so the pointer matches the winner
    requestAnimationFrame(() => wheelRef.current?.jumpTo(normalizeDegrees(plan.targetRotation)));
    store.getState().setRevealing({ winner: unrevealed, order: unrevealed.winnerOrder, requested: rules.requestedWinnerCount });
    store.getState().setPhase('revealing');
  }, [snapshot, store, wheelRef]);

  useEffect(() => () => store.getState().reset(), [store]);

  /** The user saw the winner. Saves that fact, then returns the wheel to idle. */
  const acknowledge = useCallback(async () => {
    const current = store.getState().revealing;
    if (!current) return;
    await draws.acknowledgeWinner(current.winner.id);
    store.getState().setRevealing(null);
    store.getState().setPhase('idle');
    await reload();
    notifyDataChanged();
  }, [draws, reload, store]);

  return { phase, revealing, wheelItems, eligible, spin, acknowledge };
}
