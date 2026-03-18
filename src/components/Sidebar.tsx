import { useState, useMemo } from "react";
import { Search, Trash2, Clock, X, Sparkles } from "lucide-react";
import type { ProofEntry } from "../hooks/useHistory";

interface SidebarProps {
  history: ProofEntry[];
  activeId: string | null;
  onSelect: (entry: ProofEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function Sidebar({
  history,
  activeId,
  onSelect,
  onDelete,
  onClear,
  onClose,
}: SidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter(
      (e) =>
        e.question.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q),
    );
  }, [history, search]);

  return (
    <div className="flex h-full flex-col glass-panel-heavy animate-slide-in-left">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--accent-violet)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            History
          </span>
          {history.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search proofs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] glass-input outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
            <Sparkles className="h-6 w-6 mb-2 opacity-40" />
            <p className="text-xs">
              {search ? "No matches found" : "No proofs yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={`group relative w-full text-left rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                  activeId === entry.id
                    ? "bg-[var(--accent-purple)]/15 border border-[var(--border-strong)]"
                    : "hover:bg-[var(--bg-elevated)]/60 border border-transparent"
                }`}
              >
                <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                  {entry.question}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <span>{timeAgo(entry.createdAt)}</span>
                  <span>·</span>
                  <span>{entry.thinkingSeconds}s thinking</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] px-3 py-2">
          <button
            onClick={onClear}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/5 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}
