import { create } from 'zustand';
import { DEFAULT_PREFERENCES, type AppPreferences } from '@/features/profile/types';

interface AppState {
  /** True once the database, preferences and language are ready. */
  ready: boolean;
  /** Set when the local database could not be opened (private mode, blocked storage…). */
  startupError: string | null;
  preferences: AppPreferences;
  /** Incremented after every successful write so screens can refresh their queries. */
  dataVersion: number;
  hydrate: (preferences: AppPreferences) => void;
  setStartupError: (message: string | null) => void;
  patchPreferences: (patch: Partial<AppPreferences>) => void;
  bumpData: () => void;
}

/**
 * Small in-memory cache. IndexedDB stays the source of truth: preferences are persisted before this
 * store is updated and are re-hydrated from the database on every start.
 */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  startupError: null,
  preferences: DEFAULT_PREFERENCES,
  dataVersion: 0,
  hydrate: (preferences) => set({ preferences, ready: true, startupError: null }),
  setStartupError: (startupError) => set({ startupError }),
  patchPreferences: (patch) => set((s) => ({ preferences: { ...s.preferences, ...patch } })),
  bumpData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

export const notifyDataChanged = () => useAppStore.getState().bumpData();
