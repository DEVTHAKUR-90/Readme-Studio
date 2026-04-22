"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Github,
  ShieldCheck,
  Sparkles,
  Layers,
  Download,
  History,
  Moon,
  Sun,
  Focus,
  AlignCenter,
  GitCompare,
  ListTree,
  Zap,
  FileEdit,
  Boxes,
  Command,
} from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { useMlFormatter } from "@/hooks/useMlFormatter";
import { buildToc } from "@/lib/toc";
import { cn } from "@/lib/utils";

/**
 * Toolbar — the studio's primary command surface.
 *
 * Structure:
 *   [ Brand ]  │  [ File ops ]  │  [ Editor modes ]  │  [ Transforms ]  ─── scroll ───  [ Drawers ]  │  [ Theme ]
 *
 * All buttons are fixed height, never wrap. The whole bar is horizontally
 * scrollable so nothing ever gets clipped even on narrow windows.
 */
export default function Toolbar() {
  // Individual selectors so the Toolbar only re-renders when a field it
  // actually reads changes. Previously `useMarkdownStore()` with no selector
  // caused a re-render on every keystroke (content updates ~30×/sec).
  const focusMode     = useMarkdownStore((s) => s.focusMode);
  const typewriterMode= useMarkdownStore((s) => s.typewriterMode);
  const showDiff      = useMarkdownStore((s) => s.showDiff);
  const theme         = useMarkdownStore((s) => s.theme);
  const activePanel   = useMarkdownStore((s) => s.activePanel);
  const findings      = useMarkdownStore((s) => s.findings);
  const history       = useMarkdownStore((s) => s.history);
  // Actions are stable references from Zustand, safe to pull once.
  const toggleFocusMode = useMarkdownStore((s) => s.toggleFocusMode);
  const toggleTypewriter= useMarkdownStore((s) => s.toggleTypewriter);
  const toggleDiff      = useMarkdownStore((s) => s.toggleDiff);
  const setTheme        = useMarkdownStore((s) => s.setTheme);
  const setActivePanel  = useMarkdownStore((s) => s.setActivePanel);
  const commitSave      = useMarkdownStore((s) => s.commitSave);
  const setContent      = useMarkdownStore((s) => s.setContent);

  const { polish, busy: mlBusy } = useMlFormatter();
  const [toast, setToast] = useState<{
    title: string;
    details?: string[];
    tone?: "cyan" | "pink" | "lime";
  } | null>(null);

  const showToast = (
    title: string,
    details?: string[],
    tone: "cyan" | "pink" | "lime" = "cyan",
  ) => {
    setToast({ title, details, tone });
    // Longer timeout when there are details to read.
    const ms = details && details.length > 0 ? 5000 : 2500;
    setTimeout(() => setToast(null), ms);
  };

  const criticals = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;
  const modCount = history.length > 1 ? history.length - 1 : 0;

  const handleInjectToc = () => {
    // Read content via getState() — does NOT subscribe, so the Toolbar
    // doesn't re-render when content changes (which happens every keystroke).
    const content = useMarkdownStore.getState().content;
    const toc = buildToc(content);
    if (!toc) {
      showToast("No headings found — can't build a TOC", undefined, "pink");
      return;
    }
    const lines = content.split("\n");
    const firstH1 = lines.findIndex((l) => /^#\s+/.test(l));
    const insertAt = firstH1 === -1 ? 0 : firstH1 + 1;
    const before = lines.slice(0, insertAt).join("\n");
    const after = lines.slice(insertAt).join("\n");
    setContent(`${before}\n\n${toc}\n${after}`.replace(/^\n+/, ""));
    showToast("Table of contents inserted", undefined, "lime");
  };

  const handlePolish = async () => {
    try {
      // Fresh content read at invocation time — see note above.
      const content = useMarkdownStore.getState().content;
      const before = content;
      const { text: out, meta } = await polish(content);
      setContent(out);

      if (meta.totalChanges === 0 || out === before) {
        showToast(
          "AI Polish: nothing to change",
          ["Your markdown is already clean ✨"],
          "cyan",
        );
        return;
      }

      const details = meta.changes
        .filter((c) => c.count > 0)
        .map((c) => `• ${c.rule} × ${c.count}`);

      showToast(
        `AI Polish applied — ${meta.totalChanges} edit${meta.totalChanges === 1 ? "" : "s"} in ${meta.msTaken}ms`,
        details,
        "lime",
      );
    } catch (err) {
      showToast(
        "Polish failed",
        [err instanceof Error ? err.message : String(err)],
        "pink",
      );
    }
  };

  const handleSave = () => {
    commitSave("Manual save");
    showToast("Snapshot saved", undefined, "lime");
  };

  // Command Palette → polish trigger. Dispatched as a window event so the
  // palette doesn't need to duplicate the polish worker setup. The listener
  // is attached once (empty deps) and reads fresh content via getState()
  // inside handlePolish, so it never needs to be rebuilt.
  useEffect(() => {
    const listener = () => void handlePolish();
    window.addEventListener("studio:run-polish", listener);
    return () => window.removeEventListener("studio:run-polish", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="relative z-10 px-3 pt-3 pb-2">
        <div
          className="rounded-xl px-2 py-1.5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 0 var(--border) inset",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="toolbar-scroll flex items-stretch gap-1.5 overflow-x-auto overflow-y-hidden">
          {/* ─── Brand ─── */}
          <div className="flex items-center gap-2 pr-2 shrink-0">
            <motion.div
              initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              className="relative grid h-8 w-8 place-items-center rounded-lg panel-solid"
            >
              <Zap className="h-4 w-4 text-neon-cyan drop-shadow-[0_0_6px_rgba(34,228,255,0.8)]" />
            </motion.div>
            <div className="leading-tight hidden sm:block">
              <div className="font-display text-[11px] font-semibold tracking-[0.18em] text-slate-100">
                UNIVERSAL <span className="neon-text-pink">MD</span>
              </div>
              <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-slate-500">
                readme.studio
              </div>
            </div>
          </div>

          <Divider />

          {/* ─── File ops ─── */}
          <button className="btn-ghost" onClick={handleSave} title="Save snapshot (⌘S)">
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <Divider />

          {/* ─── Editor modes ─── */}
          <ToggleButton
            active={focusMode}
            onClick={toggleFocusMode}
            icon={<Focus className="h-3.5 w-3.5" />}
            label="Focus"
          />
          <ToggleButton
            active={typewriterMode}
            onClick={toggleTypewriter}
            icon={<AlignCenter className="h-3.5 w-3.5" />}
            label="Typewriter"
          />
          <ToggleButton
            active={showDiff}
            onClick={toggleDiff}
            icon={<GitCompare className="h-3.5 w-3.5" />}
            label="Diff"
          />

          <Divider />

          {/* ─── Transforms ─── */}
          <button
            className="btn-ghost"
            onClick={handleInjectToc}
            title="Inject a Table of Contents at the top"
          >
            <ListTree className="h-3.5 w-3.5" />
            <span>TOC</span>
          </button>

          <button
            className={cn(
              "relative overflow-hidden",
              mlBusy ? "btn-neon-pink" : "btn-neon-cyan",
            )}
            onClick={handlePolish}
            disabled={mlBusy}
            title="Run AI Polish in a Web Worker"
          >
            <Sparkles className={cn("h-3.5 w-3.5", mlBusy && "animate-spin")} />
            <span>{mlBusy ? "Polishing…" : "AI Polish"}</span>
            {mlBusy && (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-neon-pink/60 animate-pulse" />
            )}
          </button>

          {/* ─── Spacer pushes drawer group to the right on wide screens ─── */}
          <div className="flex-1 min-w-4" />

          {/* Command palette launcher — the most discoverable path to it. */}
          <button
            className="btn-ghost"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }),
              )
            }
            title="Command Palette (⌘K)"
          >
            <Command className="h-3.5 w-3.5" />
            <kbd
              className="ml-0.5 font-mono text-[9px] px-1 py-[1px] rounded"
              style={{ background: "var(--surface-hi)", color: "var(--text-dim)" }}
            >
              ⌘K
            </kbd>
          </button>

          {/* ─── Drawers ─── */}
          <Divider />

          <DrawerButton
            label="Import"
            icon={<Github className="h-3.5 w-3.5" />}
            active={activePanel === "import"}
            onClick={() => setActivePanel("import")}
          />
          <DrawerButton
            label="Security"
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            active={activePanel === "security"}
            onClick={() => setActivePanel("security")}
            badge={criticals}
          />
          <DrawerButton
            label="Widgets"
            icon={<Layers className="h-3.5 w-3.5" />}
            active={activePanel === "widgets"}
            onClick={() => setActivePanel("widgets")}
          />
          <DrawerButton
            label="Tech Stack"
            icon={<Boxes className="h-3.5 w-3.5" />}
            active={activePanel === "techstack"}
            onClick={() => setActivePanel("techstack")}
          />
          <DrawerButton
            label="Changes"
            icon={<FileEdit className="h-3.5 w-3.5" />}
            active={activePanel === "modifications"}
            onClick={() => setActivePanel("modifications")}
            badge={modCount}
          />
          <DrawerButton
            label="History"
            icon={<History className="h-3.5 w-3.5" />}
            active={activePanel === "history"}
            onClick={() => setActivePanel("history")}
          />
          <DrawerButton
            label="Export"
            icon={<Download className="h-3.5 w-3.5" />}
            active={activePanel === "export"}
            onClick={() => setActivePanel("export")}
          />

          <Divider />

          <button
            className="btn-ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
          </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
              "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 drawer-solid",
              "max-w-md min-w-[280px] rounded-xl px-4 py-3",
              toast.tone === "pink" && "neon-border-pink",
              toast.tone === "lime" && "border-neon-lime/40 shadow-[0_0_20px_rgba(183,255,74,0.18)]",
              toast.tone === "cyan" && "neon-border-cyan",
            )}
          >
            <div
              className={cn(
                "font-mono text-xs font-semibold",
                toast.tone === "pink" && "text-neon-pink",
                toast.tone === "lime" && "text-neon-lime",
                toast.tone === "cyan" && "text-neon-cyan",
              )}
            >
              {toast.title}
            </div>
            {toast.details && toast.details.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-slate-400">
                {toast.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      className="mx-1 h-6 w-px self-center shrink-0"
      style={{
        background:
          "linear-gradient(to bottom, transparent, var(--border-hi), transparent)",
      }}
    />
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(active ? "btn-neon-cyan" : "btn-ghost")}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DrawerButton({
  label,
  icon,
  active,
  onClick,
  badge,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("relative", active ? "btn-neon-pink" : "btn-ghost")}
      title={label}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neon-pink/20 px-1 font-mono text-[9px] text-neon-pink ring-1 ring-neon-pink/40">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
