"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Command,
  Search,
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
  RotateCcw,
  Boxes,
  FileEdit,
} from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { buildToc } from "@/lib/toc";
import { cn } from "@/lib/utils";

/**
 * Command Palette — ⌘K / Ctrl+K opens a searchable list of every action in
 * the studio. Power users live in this; it turns the toolbar into a visual
 * shortcut rather than a requirement.
 */
interface Action {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  shortcut?: string;
  icon: ReactNode;
  run: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Individual selectors — the palette was previously subscribing to the
  // entire store, so every keystroke (~30×/sec) forced a re-render and a
  // full `actions` memo rebuild, even when the palette is closed.
  const theme            = useMarkdownStore((s) => s.theme);
  const toggleFocusMode  = useMarkdownStore((s) => s.toggleFocusMode);
  const toggleTypewriter = useMarkdownStore((s) => s.toggleTypewriter);
  const toggleDiff       = useMarkdownStore((s) => s.toggleDiff);
  const setTheme         = useMarkdownStore((s) => s.setTheme);
  const setActivePanel   = useMarkdownStore((s) => s.setActivePanel);
  const commitSave       = useMarkdownStore((s) => s.commitSave);
  const setContent       = useMarkdownStore((s) => s.setContent);
  const resetToDefault   = useMarkdownStore((s) => s.resetToDefault);

  // Open on Cmd/Ctrl+K. Close on Escape.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Autofocus input when palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const actions: Action[] = useMemo(() => {
    const close = () => setOpen(false);
    const run = (fn: () => void) => () => {
      fn();
      close();
    };
    const injectTOC = () => {
      // Fresh read — palette doesn't subscribe to `content`.
      const content = useMarkdownStore.getState().content;
      const toc = buildToc(content);
      if (!toc) return;
      const lines = content.split("\n");
      const firstH1 = lines.findIndex((l) => /^#\s+/.test(l));
      const insertAt = firstH1 === -1 ? 0 : firstH1 + 1;
      const before = lines.slice(0, insertAt).join("\n");
      const after = lines.slice(insertAt).join("\n");
      setContent(`${before}\n\n${toc}\n${after}`.replace(/^\n+/, ""));
    };
    return [
      // File ops
      {
        id: "save",
        label: "Save snapshot",
        group: "File",
        keywords: ["commit", "snapshot"],
        shortcut: "⌘S",
        icon: <Save className="h-3.5 w-3.5" />,
        run: run(() => commitSave("Manual save")),
      },
      {
        id: "reset",
        label: "Reset to default README",
        group: "File",
        keywords: ["clear", "new", "empty"],
        icon: <RotateCcw className="h-3.5 w-3.5" />,
        run: run(() => {
          if (
            confirm(
              "Reset the editor to the default welcome markdown? This creates a new history entry.",
            )
          ) {
            resetToDefault();
          }
        }),
      },

      // Editor modes
      {
        id: "focus",
        label: "Toggle Focus Mode",
        group: "Editor",
        keywords: ["fade", "concentration"],
        icon: <Focus className="h-3.5 w-3.5" />,
        run: run(toggleFocusMode),
      },
      {
        id: "typewriter",
        label: "Toggle Typewriter Mode",
        group: "Editor",
        keywords: ["centered", "cursor"],
        icon: <AlignCenter className="h-3.5 w-3.5" />,
        run: run(toggleTypewriter),
      },
      {
        id: "diff",
        label: "Toggle Diff View",
        group: "Editor",
        keywords: ["compare", "changes"],
        icon: <GitCompare className="h-3.5 w-3.5" />,
        run: run(toggleDiff),
      },

      // Transforms
      {
        id: "toc",
        label: "Insert Table of Contents",
        group: "Transform",
        keywords: ["toc", "headings", "outline"],
        icon: <ListTree className="h-3.5 w-3.5" />,
        run: run(injectTOC),
      },
      {
        id: "polish",
        label: "Run AI Polish",
        group: "Transform",
        keywords: ["format", "clean", "prettify"],
        icon: <Sparkles className="h-3.5 w-3.5" />,
        run: run(() => {
          // Dispatch a window event the Toolbar listens for. Decouples the
          // palette from the worker hook which lives in Toolbar.
          window.dispatchEvent(new CustomEvent("studio:run-polish"));
        }),
      },

      // Drawers
      {
        id: "d-import",
        label: "Open GitHub Importer",
        group: "Drawers",
        icon: <Github className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("import")),
      },
      {
        id: "d-security",
        label: "Open Security Scanner",
        group: "Drawers",
        shortcut: "⌘/",
        icon: <ShieldCheck className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("security")),
      },
      {
        id: "d-widgets",
        label: "Open Widget Builder",
        group: "Drawers",
        icon: <Layers className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("widgets")),
      },
      {
        id: "d-techstack",
        label: "Open Tech Stack",
        group: "Drawers",
        keywords: ["badges", "shields"],
        icon: <Boxes className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("techstack")),
      },
      {
        id: "d-changes",
        label: "Open Changes",
        group: "Drawers",
        keywords: ["diff", "modifications"],
        icon: <FileEdit className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("modifications")),
      },
      {
        id: "d-history",
        label: "Open History",
        group: "Drawers",
        icon: <History className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("history")),
      },
      {
        id: "d-export",
        label: "Open Export",
        group: "Drawers",
        icon: <Download className="h-3.5 w-3.5" />,
        run: run(() => setActivePanel("export")),
      },

      // Theme
      {
        id: "theme",
        label: `Switch to ${theme === "dark" ? "Light" : "Dark"} theme`,
        group: "Preferences",
        keywords: ["dark", "light", "mode"],
        icon: theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />,
        run: run(() => setTheme(theme === "dark" ? "light" : "dark")),
      },
    ];
  }, [
    theme,
    toggleFocusMode,
    toggleTypewriter,
    toggleDiff,
    setTheme,
    setActivePanel,
    commitSave,
    setContent,
    resetToDefault,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => {
      const hay = `${a.label} ${a.group} ${(a.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, actions]);

  // Keep selection index in range when the filter shrinks the list.
  useEffect(() => {
    if (idx >= filtered.length) setIdx(0);
  }, [filtered.length, idx]);

  // Scroll selected item into view on arrow navigation.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${idx}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [idx, open]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[idx]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  // Group actions for rendering.
  const grouped = useMemo(() => {
    const map = new Map<string, Action[]>();
    for (const a of filtered) {
      const list = map.get(a.group) ?? [];
      list.push(a);
      map.set(a.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="command-palette-backdrop fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="drawer-solid w-full max-w-xl rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <Search className="h-4 w-4" style={{ color: "var(--text-dim)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command… (↑ ↓ to navigate, ↵ to run, esc to close)"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text)" }}
              />
              <kbd
                className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "var(--surface-hi)", color: "var(--text-mid)" }}
              >
                esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs" style={{ color: "var(--text-dim)" }}>
                  No commands match <span style={{ color: "var(--text)" }}>&quot;{query}&quot;</span>
                </div>
              ) : (
                grouped.map(([group, list]) => (
                  <div key={group} className="mb-1">
                    <div
                      className="px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {group}
                    </div>
                    {list.map((a) => {
                      const absoluteIdx = filtered.indexOf(a);
                      const selected = absoluteIdx === idx;
                      return (
                        <button
                          key={a.id}
                          data-idx={absoluteIdx}
                          onClick={a.run}
                          onMouseMove={() => setIdx(absoluteIdx)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                          )}
                          style={{
                            background: selected ? "var(--surface-hi)" : "transparent",
                            color: selected ? "var(--text)" : "var(--text-mid)",
                          }}
                        >
                          <span style={{ color: selected ? "var(--accent-cyan)" : "var(--text-dim)" }}>
                            {a.icon}
                          </span>
                          <span className="flex-1">{a.label}</span>
                          {a.shortcut && (
                            <kbd
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "var(--surface-hi)", color: "var(--text-dim)" }}
                            >
                              {a.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div
              className="px-4 py-2 border-t flex items-center justify-between font-mono text-[10px]"
              style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
            >
              <div className="flex items-center gap-2">
                <Command className="h-3 w-3" />
                <span>Universal Markdown Studio</span>
              </div>
              <div>{filtered.length} commands</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
