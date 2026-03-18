import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "qed-nano-history";

export interface ProofEntry {
  id: string;
  question: string;
  reasoning: string;
  content: string;
  thinkingSeconds: number;
  tps: number;
  createdAt: string;
}

function loadHistory(): ProofEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProofEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: ProofEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full
  }
}

export function useHistory() {
  const [history, setHistory] = useState<ProofEntry[]>(loadHistory);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveHistory(history);
  }, [history]);

  const addEntry = useCallback(
    (entry: Omit<ProofEntry, "id" | "createdAt">): ProofEntry => {
      const full: ProofEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [full, ...prev]);
      return full;
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, deleteEntry, clearHistory } as const;
}
