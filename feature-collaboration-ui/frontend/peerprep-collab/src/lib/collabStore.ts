import { create } from "zustand";

interface TestResult {
  testNumber: number;
  status: 'passed' | 'failed' | 'error';
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  executionTime: number;
  memory: number;
  verdict: string;
  exitCode?: number;
}

interface TestExecutionResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: TestResult[];
  executionTime: number;
  language: string;
  timestamp: number;
}

interface CollabState {
  output: string;
  setOutput: (out: string) => void;
  tests: { input: string; output: string; status: string }[];
  setTests: (t: any[]) => void;
  testExecutionResults: TestExecutionResults | null;
  setTestExecutionResults: (results: TestExecutionResults | null) => void;
  isExecutingTests: boolean;
  setIsExecutingTests: (executing: boolean) => void;
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
}

export const useCollabStore = create<CollabState>((set) => ({
  output: "",
  setOutput: (out) => set({ output: out }),
  tests: [],
  setTests: (t) => set({ tests: t }),
  testExecutionResults: null,
  setTestExecutionResults: (results) => set({ testExecutionResults: results }),
  isExecutingTests: false,
  setIsExecutingTests: (executing) => set({ isExecutingTests: executing }),
  currentLanguage: "javascript",
  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),
}));
