import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  pipeline,
  TextStreamer,
  InterruptableStoppingCriteria,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import {
  LLMContext,
  type ProofSession,
  type LoadingStatus,
} from "./LLMContext";

const MODEL_ID = "onnx-community/QED-Nano-ONNX";

const EXPECTED_FILE_COUNT = 7;

export function LLMProvider({ children }: { children: ReactNode }) {
  const generatorRef = useRef<Promise<TextGenerationPipeline> | null>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());

  const [status, setStatus] = useState<LoadingStatus>({ state: "idle" });
  const [session, setSession] = useState<ProofSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [tps, setTps] = useState(0);

  useEffect(() => {
    if (generatorRef.current) return;

    generatorRef.current = (async () => {
      setStatus({ state: "loading", message: "Downloading model…" });
      try {
        const files = new Map<string, { loaded: number; total: number }>();

        const gen = await pipeline("text-generation", MODEL_ID, {
          dtype: "q4f16",
          device: "webgpu",
          progress_callback: (p: Record<string, unknown>) => {
            if (p.status !== "progress" || typeof p.loaded !== "number") return;
            files.set(p.file as string, {
              loaded: p.loaded as number,
              total: (p.total as number) ?? 0,
            });
            if (files.size < EXPECTED_FILE_COUNT) return;

            let loaded = 0,
              total = 0;
            for (const f of files.values()) {
              loaded += f.loaded;
              total += f.total;
            }
            const progress = total > 0 ? (loaded / total) * 100 : 0;
            setStatus({
              state: "loading",
              progress,
              message: `Downloading model… ${Math.round(progress)}%`,
            });
          },
        });
        setStatus({ state: "ready" });
        return gen;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus({ state: "error", error: msg });
        generatorRef.current = null;
        throw err;
      }
    })();
  }, []);

  const generate = useCallback(async (question: string) => {
    if (!generatorRef.current || isGeneratingRef.current) return;
    const generator = await generatorRef.current;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setTps(0);
    stoppingCriteria.current.reset();

    let tokenCount = 0;
    let firstTokenTime = 0;
    let lastTpsUpdate = 0;
    let insideThink = true;
    const thinkStart = performance.now();

    setSession({
      question,
      reasoning: "",
      content: "",
      thinkingSeconds: 0,
    });

    const thinkingInterval = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.content) return prev;
        const secs = Math.round((performance.now() - thinkStart) / 1000);
        if (secs === prev.thinkingSeconds) return prev;
        return { ...prev, thinkingSeconds: secs };
      });
    }, 500);

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: false,
      callback_function: (chunk: string) => {
        if (chunk === "<|im_end|>") return;

        if (insideThink) {
          const closeIdx = chunk.indexOf("</think>");
          if (closeIdx !== -1) {
            const before = chunk.slice(0, closeIdx);
            const after = chunk.slice(closeIdx + "</think>".length);
            insideThink = false;
            const finalThinkSec = Math.round(
              (performance.now() - thinkStart) / 1000,
            );

            setSession((prev) =>
              prev
                ? {
                    ...prev,
                    reasoning: (prev.reasoning + before).trim(),
                    content: prev.content + after,
                    thinkingSeconds: finalThinkSec,
                  }
                : prev,
            );
            return;
          }
        }

        setSession((prev) => {
          if (!prev) return prev;
          if (insideThink) {
            return { ...prev, reasoning: prev.reasoning + chunk };
          }
          return { ...prev, content: prev.content + chunk };
        });
      },
      token_callback_function: () => {
        tokenCount++;
        if (tokenCount === 1) {
          firstTokenTime = performance.now();
        } else {
          const now = performance.now();
          if (now - lastTpsUpdate < 250) return;
          lastTpsUpdate = now;
          const elapsed = (now - firstTokenTime) / 1000;
          if (elapsed > 0) {
            setTps(Math.round(((tokenCount - 1) / elapsed) * 10) / 10);
          }
        }
      },
    });
    
    try {
      const messages = [{ role: "user" as const, content: question }];
      await generator(messages, {
        max_new_tokens: 8192,
        do_sample: true,
        temperature: 0.6,
        top_k: 20,
        streamer,
        stopping_criteria: stoppingCriteria.current,
      });
    } catch (err) {
      console.error("Generation error:", err);
    }

    clearInterval(thinkingInterval);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            content: prev.content.trim(),
            reasoning: prev.reasoning.trim(),
          }
        : prev,
    );

    isGeneratingRef.current = false;
    setIsGenerating(false);
  }, []);

  const stop = useCallback(() => {
    stoppingCriteria.current.interrupt();
  }, []);

  const clearSession = useCallback(() => {
    if (isGeneratingRef.current) return;
    setSession(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      status,
      session,
      isGenerating,
      tps,
      generate,
      stop,
      clearSession,
    }),
    [status, session, isGenerating, tps, generate, stop, clearSession],
  );

  return (
    <LLMContext.Provider value={contextValue}>{children}</LLMContext.Provider>
  );
}
