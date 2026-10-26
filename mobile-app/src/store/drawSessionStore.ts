import { create } from 'zustand';
import type { DrawParticipant, DrawWinnerWithName, WheelPhase } from '@/features/wheel/types';

/**
 * Transient state of the spin screen only. Everything durable (session, roster, winners) is in SQLite;
 * this store just coordinates the animation: which phase we are in and which winner is being revealed.
 */
interface DrawSessionState {
  phase: WheelPhase;
  /** Winner whose reveal modal is open. Saved in SQLite already. */
  revealing: { winner: DrawWinnerWithName; order: number; requested: number } | null;
  /** Segments currently drawn on the wheel (frozen while spinning/revealing). */
  wheelItems: DrawParticipant[];
  setPhase: (phase: WheelPhase) => void;
  setWheelItems: (items: DrawParticipant[]) => void;
  setRevealing: (value: DrawSessionState['revealing']) => void;
  reset: () => void;
}

const initial = { phase: 'idle' as WheelPhase, revealing: null, wheelItems: [] as DrawParticipant[] };

export const useDrawSessionStore = create<DrawSessionState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setWheelItems: (wheelItems) => set({ wheelItems }),
  setRevealing: (revealing) => set({ revealing }),
  reset: () => set(initial),
}));
