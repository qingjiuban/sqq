import { create } from "zustand";

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  running: boolean;
  exitCode: number | null;
  timedOut: boolean;
  at: number;
}

interface TerminalStore {
  entries: TerminalEntry[];
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggle: () => void;
  append: (entry: Omit<TerminalEntry, "id" | "at"> & { id?: string }) => string;
  clear: () => void;
}

let counter = 0;

export const useTerminalStore = create<TerminalStore>((set) => ({
  entries: [],
  visible: false,
  setVisible: (visible) => set({ visible }),
  toggle: () => set((s) => ({ visible: !s.visible })),
  append: (entry) => {
    counter += 1;
    const id = entry.id ?? `term_${Date.now().toString(36)}_${counter}`;
    set((s) => ({
      entries: [...s.entries, { ...entry, id, at: Date.now() }].slice(-100),
    }));
    return id;
  },
  clear: () => set({ entries: [] }),
}));
