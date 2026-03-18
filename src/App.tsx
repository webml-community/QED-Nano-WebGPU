import { useState, useCallback } from "react";

import { LLMProvider } from "./hooks/LLMProvider";
import { LandingPage } from "./components/LandingPage";
import { AppShell } from "./components/AppShell";
import "katex/dist/katex.min.css";

function App() {
  const [started, setStarted] = useState(false);
  const handleStart = useCallback(() => setStarted(true), []);

  return (
    <div className="relative h-screen w-screen bg-[var(--bg-deep)]">
      <div
        className={`fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${
          started ? "opacity-60" : "opacity-100"
        }`}
      >
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="bg-blob bg-blob-4" />
      </div>

      <div
        className={`absolute inset-0 z-10 transition-opacity duration-500 ${
          started ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <LandingPage onStart={handleStart} />
      </div>

      {started && (
        <LLMProvider>
          <AppShell />
        </LLMProvider>
      )}
    </div>
  );
}

export default App;
