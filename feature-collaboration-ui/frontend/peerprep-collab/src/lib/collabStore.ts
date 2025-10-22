import { create } from "zustand";

interface CollabState {
  output: string;
  setOutput: (out: string) => void;
  tests: { input: string; output: string; status: string }[];
  setTests: (t: any[]) => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  output: "",
  setOutput: (out) => set({ output: out }),
  tests: [],
  setTests: (t) => set({ tests: t }),
}));
