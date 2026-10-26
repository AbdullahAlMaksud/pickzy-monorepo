import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  current: ToastMessage | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id?: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (message, tone = 'info') => set({ current: { id: nextId++, message, tone } }),
  dismiss: (id) => {
    const current = get().current;
    if (current && (id === undefined || current.id === id)) set({ current: null });
  },
}));

export const showToast = (message: string, tone: ToastTone = 'info') =>
  useToastStore.getState().show(message, tone);
