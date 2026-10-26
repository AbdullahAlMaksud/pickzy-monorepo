import { create } from 'zustand';
import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
} from '@/features/profile/types';

interface AppState {
  /** True once the database, preferences, language and fonts are ready. */
  ready: boolean;
  preferences: AppPreferences;
  /** Incremented after every successful write so screens can refresh their SQLite queries. */
  dataVersion: number;
  setReady: (ready: boolean) => void;
  hydrate: (preferences: AppPreferences) => void;
  patchPreferences: (patch: Partial<AppPreferences>) => void;
  bumpData: () => void;
}

/**
 * Small in-memory cache. SQLite stays the source of truth: preferences are persisted before this store
 * is updated and are re-hydrated from the database on every app start.
 */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  preferences: DEFAULT_PREFERENCES,
  dataVersion: 0,
  setReady: (ready) => set({ ready }),
  hydrate: (preferences) => set({ preferences }),
  patchPreferences: (patch) => set((s) => ({ preferences: { ...s.preferences, ...patch } })),
  bumpData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

export const notifyDataChanged = () => useAppStore.getState().bumpData();
