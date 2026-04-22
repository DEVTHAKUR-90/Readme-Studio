"use client";

import { useMemo, type ReactNode } from "react";
import { FileEdit, Plus, Minus, GitCommit } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";
import { diffLines } from "@/lib/diff";
import { cn } from "@/lib/utils";

/**
 * Modifications drawer.
 *
 * Answers the question "what have I changed since the last snapshot?" — shows
 * a line-by-line diff, a churn summary (additions / deletions / net chars),
 * and the running count of snapshots for context.
 */
export default function ModificationsDrawer() {
  const content = useMarkdownStore((s) => s.content);
  const lastSavedContent = useMarkdownStore((s) => s.lastSavedContent);
  const history = useMarkdownStore((s) => s.history);
  const commitSave = useMarkdownStore((s) => s.commitSave);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);

  const ops = useMemo(
    () => diffLines(lastSavedContent, content),
    [lastSavedContent, content],
  );

  const added = ops.filter((o) => o.type === "add").length;
  const removed = ops.filter((o) => o.type === "remove").length;
  const netChars = content.length - lastSavedContent.length;
  const hasChanges = added > 0 || removed > 0;

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="Modifications" onClose={() => setActivePanel("none")} />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-2">
          <Stat
            icon={<Plus className="h-3.5 w-3.5" />}
            label="Added"
            value={added}
            tone="lime"
          />
          <Stat
            icon={<Minus className="h-3.5 w-3.5" />}
            label="Removed"
            value={removed}
            tone="pink"
          />
          <Stat
            icon={<GitCommit className="h-3.5 w-3.5" />}
            label="Snapshots"
            value={history.length}
            tone="cyan"
          />
        </div>

        {/* Net diff */}
        <div className="rounded-lg border border-white/5 bg-ink-950/60 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Net character delta
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                netChars > 0 && "text-neon-lime",
                netChars < 0 && "text-neon-pink",
                netChars === 0 && "text-slate-400",
              )}
            >
              {netChars > 0 ? "+" : ""}
              {netChars.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action */}
        <button
          disabled={!hasChanges}
          onClick={() => commitSave("Snapshot via Modifications")}
          className={cn(
            "w-full justify-center",
            hasChanges ? "btn-neon-cyan" : "btn-ghost",
          )}
        >
          <GitCommit className="h-3.5 w-3.5" />
          <span>
            {hasChanges ? "Commit snapshot" : "No changes since last save"}
          </span>
        </button>

        {/* Diff body */}
        <div>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Line-by-line diff
          </h3>
          {!hasChanges ? (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
              The editor matches the last saved snapshot exactly.
            </div>
          ) : (
            <div className="rounded-lg border border-white/5 bg-ink-950/60 overflow-hidden">
              <div className="max-h-[50vh] overflow-auto p-3 font-mono text-[11px] leading-relaxed">
                {ops.map((op, i) => (
                  <div
                    key={i}
                    className={cn(
                      "whitespace-pre-wrap break-words py-[1px]",
                      op.type === "add" && "diff-added text-[#3fb950]",
                      op.type === "remove" && "diff-removed text-[#f85149]",
                      op.type === "equal" && "text-slate-500",
                    )}
                  >
                    <span className="mr-2 select-none opacity-40">
                      {op.type === "add" ? "+" : op.type === "remove" ? "−" : " "}
                    </span>
                    {op.value || " "}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/5 bg-ink-950/50 p-3 text-[11px] text-slate-500 leading-relaxed">
          <FileEdit className="mb-1 h-3 w-3 text-neon-cyan" />
          Diff compares the current editor buffer against the most recent
          snapshot. Snapshots auto-save every 2s after you stop typing, or
          manually with <kbd className="font-mono">⌘S</kbd>.
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "lime" | "pink" | "cyan";
}) {
  const toneCls = {
    lime: "border-neon-lime/40 text-neon-lime",
    pink: "border-neon-pink/40 text-neon-pink",
    cyan: "border-neon-cyan/40 text-neon-cyan",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-xl border bg-ink-950/70 p-3 text-center",
        toneCls,
      )}
    >
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
    </div>
  );
}
