"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { useSecurityScanner } from "@/hooks/useSecurityScanner";
import { useClickOutside } from "@/hooks/useClickOutside";
import Toolbar from "./ui/Toolbar";
import CommandPalette from "./ui/CommandPalette";
import EditorPane from "./editor/EditorPane";
import PreviewPane from "./preview/PreviewPane";
import ImporterDrawer from "./panels/ImporterDrawer";
import SecurityDrawer from "./panels/SecurityDrawer";
import WidgetsDrawer from "./panels/WidgetsDrawer";
import ExportDrawer from "./panels/ExportDrawer";
import HistoryDrawer from "./panels/HistoryDrawer";
import ModificationsDrawer from "./panels/ModificationsDrawer";
// TechStackDrawer pulls in simple-icons (~1MB of brand data) and the
// virtualization library, so we lazy-load it. The drawer's entry is only
// needed once the user actually opens the "Tech Stack" panel, which keeps
// the initial workspace bundle fast.
const TechStackDrawer = dynamic(() => import("./panels/TechStackDrawer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
        <p className="font-mono text-[10px] tracking-widest text-neon-cyan/70">
          LOADING CATALOG
        </p>
      </div>
    </div>
  ),
});
import { cn } from "@/lib/utils";

/**
 * The Workspace is the top-level client component. It:
 *   · wires auto-save (debounced `commitSave`)
 *   · runs the security scanner hook
 *   · owns the resizable splitter state
 *   · toggles the active drawer
 */
export default function Workspace() {
  useSecurityScanner();

  const content = useMarkdownStore((s) => s.content);
  const lastSavedContent = useMarkdownStore((s) => s.lastSavedContent);
  const commitSave = useMarkdownStore((s) => s.commitSave);
  const activePanel = useMarkdownStore((s) => s.activePanel);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);
  const theme = useMarkdownStore((s) => s.theme);

  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // --- Auto-save (debounced) -----------------------------------------------
  useEffect(() => {
    if (content === lastSavedContent) return;
    const t = setTimeout(() => commitSave("Auto-save"), 2000);
    return () => clearTimeout(t);
  }, [content, lastSavedContent, commitSave]);

  // --- Keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        commitSave("Manual save");
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        setActivePanel("security");
      }
      if (e.key === "Escape") setActivePanel("none");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commitSave, setActivePanel]);

  // --- Theme class sync on <html> (drives preview `prefers-color-scheme`) --
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
  }, [theme]);

  // --- Splitter drag handlers ---------------------------------------------
  const onDragStart = useCallback((e: PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);
  const onDragMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.min(85, Math.max(15, pct)));
  }, []);
  const onDragEnd = useCallback((e: PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  // Refs for the click-outside contract — the toolbar is "inside" too so
  // clicking the button that opened a drawer doesn't both dismiss it and
  // immediately reopen it on the next pointerdown cycle.
  const drawerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    [drawerRef, toolbarRef],
    () => setActivePanel("none"),
    activePanel !== "none",
  );

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <div ref={toolbarRef}>
        <Toolbar />
      </div>

      <div
        ref={containerRef}
        className="relative z-[1] flex flex-1 overflow-hidden px-3 pb-3 gap-0"
      >
        {/* EDITOR */}
        <div
          className="h-full min-w-0"
          style={{ width: `calc(${splitPct}% - 4px)` }}
        >
          <EditorPane />
        </div>

        {/* SPLITTER */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          className={cn(
            "group relative mx-1 flex w-2 cursor-col-resize items-center justify-center select-none",
          )}
        >
          <div className="h-20 w-[3px] rounded-full bg-gradient-to-b from-neon-pink/60 via-white/20 to-neon-cyan/60 transition-opacity opacity-40 group-hover:opacity-100 group-active:opacity-100" />
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        </div>

        {/* PREVIEW */}
        <div
          className="h-full min-w-0"
          style={{ width: `calc(${100 - splitPct}% - 4px)` }}
        >
          <PreviewPane />
        </div>
      </div>

      {/* DRAWERS */}
      <AnimatePresence>
        {activePanel !== "none" && (
          <motion.div
            key={activePanel}
            ref={drawerRef}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="pointer-events-auto fixed right-3 top-16 bottom-3 z-40 w-full max-w-md"
          >
            <div className="drawer-solid h-full overflow-hidden rounded-2xl">
              {activePanel === "import" && <ImporterDrawer />}
              {activePanel === "security" && <SecurityDrawer />}
              {activePanel === "widgets" && <WidgetsDrawer />}
              {activePanel === "export" && <ExportDrawer />}
              {activePanel === "history" && <HistoryDrawer />}
              {activePanel === "modifications" && <ModificationsDrawer />}
              {activePanel === "techstack" && <TechStackDrawer />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette />
    </div>
  );
}
