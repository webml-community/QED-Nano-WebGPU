import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  Sparkles,
  PanelLeftOpen,
  PanelLeftClose,
  Plus,
  Square,
  Loader2,
} from "lucide-react";

import { useLLM } from "../hooks/useLLM";
import { ProofView } from "./ProofView";
import { useHistory, type ProofEntry } from "../hooks/useHistory";
import { Sidebar } from "./Sidebar";

const EXAMPLE_PROMPTS = [
  {
    label: "Is √2 rational or irrational?",
    prompt:
      "Generate a rigorous proof to the following question: is $\\sqrt{2}$ rational or irrational?",
  },
  {
    label: "Find all functions f : ℤ → ℤ where …",
    prompt:
      "Determine all functions $f : \\mathbb{Z} \\to \\mathbb{Z}$ such that, for all $x, y \\in \\mathbb{Z}$, we have $f(2x) + 2f(y) = f(f(x + y)).$",
  },
  {
    label: "Prove n⁵ - n is divisible by 30",
    prompt:
      "Prove that for all integers $n \\ge 1$, the number $n^5 - n$ is divisible by 30.",
  },
  {
    label: "Sum of 1/n² converges",
    prompt:
      "Prove that the series $\\sum_{n=1}^{\\infty} \\frac{1}{n^2}$ converges.",
  },
];

const TEXTAREA_MIN_H = "7.5rem";

export function ChatApp() {
  const { session, isGenerating, tps, generate, stop, clearSession } = useLLM();
  const { history, addEntry, deleteEntry, clearHistory } = useHistory();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<ProofEntry | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prevGenerating = useRef(false);
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && session && session.content) {
      addEntry({
        question: session.question,
        reasoning: session.reasoning,
        content: session.content,
        thinkingSeconds: session.thinkingSeconds,
        tps,
      });
    }
    prevGenerating.current = isGenerating;
  }, [isGenerating, session, tps, addEntry]);

  const handleSubmit = useCallback(
    (e?: React.SubmitEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || isGenerating) return;
      setInput("");
      setViewingEntry(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = TEXTAREA_MIN_H;
      }
      generate(text);
    },
    [input, isGenerating, generate],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleNewProof = useCallback(() => {
    if (isGenerating) return;
    clearSession();
    setViewingEntry(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [isGenerating, clearSession]);

  const handleSelectHistory = useCallback(
    (entry: ProofEntry) => {
      if (isGenerating) return;
      clearSession();
      setViewingEntry(entry);
    },
    [isGenerating, clearSession],
  );

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = TEXTAREA_MIN_H;
      e.target.style.height = e.target.scrollHeight + "px";
    },
    [],
  );

  const handleExamplePrompt = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const idx = Number(e.currentTarget.dataset.idx);
      setViewingEntry(null);
      generate(EXAMPLE_PROMPTS[idx].prompt);
    },
    [generate],
  );

  const viewSession = viewingEntry ?? session;

  const showProof = viewSession !== null;
  const isViewingHistory = viewingEntry !== null;

  return (
    <div className="flex h-full text-[var(--text-primary)]">
      {sidebarOpen && (
        <div className="relative z-20 w-72 shrink-0 h-full">
          <Sidebar
            history={history}
            activeId={viewingEntry?.id ?? null}
            onSelect={handleSelectHistory}
            onDelete={deleteEntry}
            onClear={clearHistory}
            onClose={closeSidebar}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <header className="flex-none flex items-center justify-between px-4 py-3 h-14 glass-panel">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[var(--text-primary)]">
                QED-Nano
              </h1>
              <span className="text-base font-semibold gradient-text">
                WebGPU
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating && (
              <>
                {tps > 0 && (
                  <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] tabular-nums">
                    <Loader2 className="h-3 w-3 animate-spin text-[var(--accent-violet)]" />
                    {tps.toFixed(1)} tok/s
                  </span>
                )}
                <button
                  onClick={stop}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-red-400 glass-card hover:border-red-400/30 transition-all cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Stop
                </button>
              </>
            )}
            {showProof && !isGenerating && (
              <button
                onClick={handleNewProof}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                New Proof
              </button>
            )}
          </div>
        </header>

        {showProof ? (
          <ProofView
            session={viewSession!}
            isGenerating={!isViewingHistory && isGenerating}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 animate-fade-in">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="h-6 w-6 text-[var(--accent-violet)]" />
              </div>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                What would you like to prove?
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Ask a math question and get a rigorous proof
              </p>
            </div>

            <div className="w-full max-w-3xl">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    className="w-full rounded-xl glass-input px-4 py-3 pb-11 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] disabled:opacity-50 resize-none max-h-40 outline-none"
                    style={{
                      minHeight: TEXTAREA_MIN_H,
                      height: TEXTAREA_MIN_H,
                    }}
                    placeholder="Describe a mathematical statement to prove…"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    autoFocus
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end pb-3 px-2">
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-violet)] disabled:opacity-30 transition-colors cursor-pointer"
                      title="Generate proof"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              <p className="mt-2 text-center text-[10px] text-[var(--text-muted)] opacity-60">
                Everything runs locally in your browser. AI can make mistakes.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl">
              {EXAMPLE_PROMPTS.map(({ label }, i) => (
                <button
                  key={label}
                  data-idx={i}
                  onClick={handleExamplePrompt}
                  className="rounded-lg glass-card px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-all cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
