import { createContext } from "react";

export type LoadingStatus =
  | { state: "idle" }
  | { state: "loading"; progress?: number; message?: string }
  | { state: "ready" }
  | { state: "error"; error: string };

export interface ProofSession {
  question: string;
  reasoning: string;
  content: string;
  thinkingSeconds: number;
}

export interface LLMContextValue {
  status: LoadingStatus;
  session: ProofSession | null;
  isGenerating: boolean;
  tps: number;
  generate: (question: string) => void;
  stop: () => void;
  clearSession: () => void;
}

export const LLMContext = createContext<LLMContextValue | null>(null);
