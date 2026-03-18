import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import katex from "katex";
import {
  Brain,
  ChevronDown,
  Copy,
  ClipboardCheck,
  Download,
  FileText,
} from "lucide-react";
import type { ProofSession } from "../hooks/LLMContext";

const math = createMathPlugin({ singleDollarTextMath: true });

function renderInlineMath(text: string): string {
  return text.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, expr) =>
    katex.renderToString(expr, { throwOnError: false }),
  );
}
interface ProofViewProps {
  session: ProofSession;
  isGenerating: boolean;
}

/** Convert \[...\] / \(...\) → $$...$$ (`$$$$` in replacement = literal `$$`). */
function prepareForMathDisplay(content: string): string {
  return content.replace(/(?<!\\)\\[[(]/g, "$$$$").replace(/\\[\])]/g, "$$$$");
}

export function ProofView({ session, isGenerating }: ProofViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const proofContentRef = useRef<HTMLDivElement>(null);
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const isThinking = isGenerating && !session.content;

  const questionHtml = useMemo(
    () => renderInlineMath(escapeHtml(session.question)),
    [session.question],
  );

  const scrollRafRef = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isGenerating) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    }
  }, [session.content, session.reasoning, isGenerating]);

  useEffect(() => {
    if (session.content && isGenerating) {
      setReasoningOpen(false);
    }
  }, [session.content, isGenerating]);

  const wasGenerating = useRef(false);
  useEffect(() => {
    if (wasGenerating.current && !isGenerating && session.content) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 120);
      return () => clearTimeout(t);
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating, session.content]);

  const handleCopyMarkdown = useCallback(async () => {
    const md = buildMarkdown(session);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [session]);

  const preparedContent = useMemo(
    () => prepareForMathDisplay(session.content),
    [session.content],
  );

  const handleDownloadMd = useCallback(() => {
    const md = buildMarkdown(session);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [session]);

  const handleExportPDF = useCallback(() => {
    const html = buildPrintDocument(
      session,
      proofContentRef.current?.innerHTML ?? "<p>(No content)</p>",
    );
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
    }
  }, [session]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-purple)]/15 border border-[var(--border-subtle)]">
              <span className="text-sm">✨</span>
            </div>
            <h1
              className="text-xl font-semibold text-[var(--text-primary)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />
          </div>
        </div>

        {(session.reasoning || isThinking) && (
          <div className="mb-6 glass-card px-4 py-3">
            <button
              onClick={() => setReasoningOpen((v) => !v)}
              className="flex w-full items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <Brain className="h-3.5 w-3.5 text-[var(--accent-violet)]" />
              {isThinking ? (
                <span className="thinking-shimmer font-medium">
                  Thinking… {session.thinkingSeconds}s
                </span>
              ) : (
                <span>Thought for {session.thinkingSeconds}s</span>
              )}
              <ChevronDown
                className={`ml-auto h-3 w-3 transition-transform duration-200 ${
                  reasoningOpen ? "" : "-rotate-90"
                }`}
              />
            </button>
            {reasoningOpen && (
              <div
                className={`mt-3 text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap border-t border-[var(--border-subtle)] pt-3 overflow-y-auto ${
                  isThinking ? "" : "max-h-64"
                }`}
              >
                {session.reasoning || (
                  <span className="italic opacity-50">Reasoning…</span>
                )}
              </div>
            )}
          </div>
        )}

        {session.content && (
          <div className="proof-section pl-5">
            <div
              ref={proofContentRef}
              className="glass-card px-6 py-5 text-sm leading-relaxed text-[var(--text-primary)]"
            >
              <Streamdown
                plugins={{ math }}
                parseIncompleteMarkdown={false}
                isAnimating={isGenerating}
              >
                {preparedContent}
              </Streamdown>
            </div>
          </div>
        )}

        {!isGenerating && session.content && (
          <div className="mt-6 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card transition-all cursor-pointer"
                title="Copy as Markdown"
              >
                {copied ? (
                  <ClipboardCheck className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Markdown
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card transition-all cursor-pointer"
                title="Export as PDF"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </button>
              <button
                onClick={handleDownloadMd}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] glass-card transition-all cursor-pointer"
                title="Download .md file"
              >
                <Download className="h-3.5 w-3.5" />
                .md
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function collectInlinedCss(): string {
  const parts: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) parts.push(rule.cssText);
    } catch {
      // CORS-restricted sheet — skip
    }
  }
  return parts.join("\n");
}

const PDF_OVERRIDE_CSS = `
  html, body {
    height: auto !important; max-height: none !important; overflow: visible !important;
    background: #fff !important; color: #1a1a2e !important;
    font-family: 'Georgia', 'Times New Roman', serif;
    max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.8;
  }
  #root, div, section, main, article, aside, p, ul, ol, li, blockquote, pre, h1, h2, h3, h4, h5, h6 {
    overflow: visible !important; max-height: none !important; height: auto !important;
  }
  *, *::before, *::after { animation: none !important; transition: none !important; }
  body, body > *, body p, body li, body span:not(.katex span), body div {
    color: #1a1a2e !important; background: transparent !important; border-color: #e5e7eb !important;
  }
  h1, h2, h3 { color: #1a1a2e !important; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #8b5cf6; padding-bottom: 0.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.2rem; color: #6d28d9 !important; margin-top: 2rem; }
  h3 { font-size: 1.1rem; color: #6d28d9 !important; margin-top: 1.5rem; }
  .meta { font-size: 0.85rem; color: #888 !important; margin-bottom: 2rem; }
  pre { background: #f5f3ff !important; padding: 1rem; border-radius: 8px; }
  code { font-size: 0.9em; color: #1a1a2e !important; }
  blockquote { border-left: 3px solid #8b5cf6 !important; margin-left: 0; padding-left: 1rem; color: #555 !important; }
  strong { font-weight: bold; } em { font-style: italic; }
  .katex, .katex * { color: #1a1a2e !important; }
  [class*="glass"], [class*="ambient"] { background: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; box-shadow: none !important; }
  p, li, h2, h3, .katex-display { page-break-inside: avoid; }
`;

function buildPrintDocument(
  session: ProofSession,
  renderedProofHtml: string,
): string {
  const title = renderInlineMath(escapeHtml(session.question));
  const inlinedCss = collectInlinedCss();

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${escapeHtml(session.question.slice(0, 60))}</title>
<style>${inlinedCss}</style>
<style>${PDF_OVERRIDE_CSS}</style>
</head><body>
<h1>${title}</h1>
<p class="meta">Generated by QED-Nano · ${new Date().toLocaleDateString()} · ${session.thinkingSeconds}s reasoning</p>
<div>${renderedProofHtml}</div>
<script>window.onload = () => { setTimeout(() => window.print(), 300); }</script>
</body></html>`;
}

function buildMarkdown({
  question,
  reasoning,
  content,
  thinkingSeconds,
}: ProofSession): string {
  const header = `# ${question}\n\n`;
  const details = reasoning
    ? `<details>\n<summary>Reasoning (${thinkingSeconds}s)</summary>\n\n${reasoning}\n\n</details>\n\n---\n\n`
    : "";
  return header + details + content;
}

const HTML_ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESC[c]);
}
