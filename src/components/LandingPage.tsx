import { useState, useCallback } from "react";

const FEATURES = [
  {
    title: "Proof-writing powerhouse",
    description:
      "QED-Nano achieves 40% on IMO-ProofBench, matching GPT-OSS-120B from OpenAI — all in a 4B parameter model running locally.",
  },
  {
    title: "Completely private & offline-capable",
    description:
      "Everything runs in your browser with 🤗 Transformers.js and ONNX Runtime Web — no data ever leaves your device.",
  },
  {
    title: "WebGPU-accelerated inference",
    description:
      "Requires a browser with WebGPU support and sufficient VRAM to run the model.",
  },
];

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [fading, setFading] = useState(false);

  const handleStart = useCallback(() => {
    setFading(true);
    setTimeout(onStart, 400);
  }, [onStart]);

  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden text-[var(--text-primary)]">
      <div
        className={`relative z-10 flex max-w-3xl flex-col items-center px-6 text-center transition-all duration-500 ${
          fading ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"
        }`}
      >
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-[var(--text-primary)]">QED-Nano</span>{" "}
          <span className="gradient-text">WebGPU</span>
        </h1>

        <p className="mt-5 text-lg text-[var(--text-muted)]">
          Run{" "}
          <a
            href="https://huggingface.co/onnx-community/QED-Nano-ONNX"
            target="_blank"
            className="underline decoration-[var(--accent-purple)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            QED-Nano
          </a>{" "}
          locally in your browser, powered by{" "}
          <a
            href="https://github.com/huggingface/transformers.js"
            target="_blank"
            className="underline decoration-[var(--accent-purple)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            Transformers.js
          </a>
        </p>

        <div className="max-w-xl mt-12 flex flex-col gap-6 text-left">
          {FEATURES.map(({ title, description }, i) => (
            <div key={i} className="flex items-start gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-medium)] text-sm font-medium text-[var(--accent-violet)]">
                {i + 1}
              </span>
              <div>
                <p className="text-base font-medium text-[var(--text-primary)]">
                  {title}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="mt-10 rounded-xl border border-[var(--accent-purple)]/30 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-fuchsia)] px-8 py-3 text-base font-semibold text-white hover:opacity-90 transition-all duration-200 cursor-pointer glow-purple"
        >
          Load Model &amp; Start Proving
        </button>

        <p className="mt-3 text-xs text-[var(--text-muted)] opacity-60">
          ~2.6 GB will be downloaded and cached in your browser.
        </p>
      </div>
    </div>
  );
}
