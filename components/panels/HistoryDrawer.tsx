"use client";

import { Clock, RotateCcw } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";

export default function HistoryDrawer() {
  const history = useMarkdownStore((s) => s.history);
  const restore = useMarkdownStore((s) => s.restoreFromHistory);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);
  const lastSavedContent = useMarkdownStore((s) => s.lastSavedContent);

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="History" onClose={() => setActivePanel("none")} />
      <div className="flex-1 overflow-auto p-4 space-y-2">
        <p className="text-[11px] text-slate-500 mb-3">
          Rolling snapshots from auto-save and manual saves. Restores replace
          the editor content without clearing history.
        </p>
        {history.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
            No history yet. Press ⌘S to snapshot.
          </div>
        ) : (
          history.map((entry) => {
            const isCurrent = entry.content === lastSavedContent;
            const time = new Date(entry.timestamp);
            const preview = entry.content.slice(0, 80).replace(/\s+/g, " ");
            return (
              <div
                key={entry.id}
                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-neon-cyan/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="font-mono text-[11px] text-slate-300">
                        {time.toLocaleTimeString()} ·{" "}
                        {time.toLocaleDateString()}
                      </span>
                      {isCurrent && (
                        <span className="chip bg-neon-lime/20 text-neon-lime">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                      {entry.label ?? "snapshot"}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-400">
                      {preview}…
                    </div>
                  </div>
                  <button
                    disabled={isCurrent}
                    onClick={() => restore(entry.id)}
                    className="btn-ghost shrink-0 disabled:opacity-30"
                    title="Restore this snapshot"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
