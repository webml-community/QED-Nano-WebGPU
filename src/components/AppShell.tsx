import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useLLM } from "../hooks/useLLM";
import { ChatApp } from "./ChatApp";

export function AppShell() {
  const { status } = useLLM();
  const isReady = status.state === "ready";
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    if (isReady) {
      const t = setTimeout(() => setShowApp(true), 300);
      return () => clearTimeout(t);
    }
  }, [isReady]);

  return (
    <>
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-500 ${
          showApp ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent-violet)]" />
        <p className="mt-4 text-base text-[var(--text-muted)]">
          {status.state === "loading"
            ? (status.message ?? "Loading model…")
            : status.state === "error"
              ? "Error"
              : "Initializing…"}
        </p>
        <div className="mt-3 w-72 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-fuchsia)] rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${(status.state === "loading" && status.progress) || (status.state === "ready" ? 100 : 0)}%`,
            }}
          />
        </div>
        {status.state === "error" && (
          <p className="mt-2 text-sm text-red-400">{status.error}</p>
        )}
      </div>

      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          showApp ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChatApp />
      </div>
    </>
  );
}
