import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
}

interface ToastState {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

let next = 1;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** A short glass notice at the bottom of the window ("Added to Chill Mix"). */
export function toast(text: string, ms = 2600): void {
  const id = next++;
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, text }] }));
  setTimeout(() => useToasts.getState().dismiss(id), ms);
}
