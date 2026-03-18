import { useContext } from "react";
import { LLMContext } from "./LLMContext";

export function useLLM() {
  const ctx = useContext(LLMContext);
  if (!ctx) throw new Error("useLLM must be used within <LLMProvider>");
  return ctx;
}

export type {
  LLMContextValue,
  ProofSession,
  LoadingStatus,
} from "./LLMContext";
