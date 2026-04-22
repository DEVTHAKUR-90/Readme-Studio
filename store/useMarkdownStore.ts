"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HistoryEntry, SecurityFinding, ThemeMode } from "@/types";
import { DEFAULT_MARKDOWN, uid } from "@/lib/utils";

/**
 * Auto-save history cap. We keep the last N saves for diffing and restore.
 */
const HISTORY_CAP = 20;

interface MarkdownState {
  // --- Content -----------------------------------------------------------
  content: string;
  lastSavedContent: string;
  history: HistoryEntry[];

  // --- Editor ergonomics -------------------------------------------------
  focusMode: boolean;
  typewriterMode: boolean;
  showDiff: boolean;
  showLineNumbers: boolean;

  // --- UI ----------------------------------------------------------------
  theme: ThemeMode;
  activePanel: "none" | "widgets" | "security" | "import" | "export" | "history" | "modifications" | "techstack";
  previewScale: number;

  // --- Security ----------------------------------------------------------
  findings: SecurityFinding[];

  // --- Actions -----------------------------------------------------------
  setContent: (next: string) => void;
  commitSave: (label?: string) => void;
  restoreFromHistory: (entryId: string) => void;
  resetToDefault: () => void;

  toggleFocusMode: () => void;
  toggleTypewriter: () => void;
  toggleDiff: () => void;
  toggleLineNumbers: () => void;

  setTheme: (t: ThemeMode) => void;
  setActivePanel: (p: MarkdownState["activePanel"]) => void;
  setPreviewScale: (s: number) => void;

  setFindings: (f: SecurityFinding[]) => void;
}

/**
 * Persisted Zustand store. The persist middleware only runs on the client,
 * so consumers must import this module from a `"use client"` file.
 */
export const useMarkdownStore = create<MarkdownState>()(
  persist(
    (set, get) => ({
      content: DEFAULT_MARKDOWN,
      lastSavedContent: DEFAULT_MARKDOWN,
      history: [
        {
          id: uid("hist"),
          timestamp: Date.now(),
          content: DEFAULT_MARKDOWN,
          label: "Initial state",
        },
      ],

      focusMode: false,
      typewriterMode: false,
      showDiff: false,
      showLineNumbers: true,

      theme: "dark",
      activePanel: "none",
      previewScale: 1,

      findings: [],

      setContent: (next) => set({ content: next }),

      commitSave: (label) => {
        const { content, history } = get();
        const entry: HistoryEntry = {
          id: uid("hist"),
          timestamp: Date.now(),
          content,
          label,
        };
        const nextHistory = [entry, ...history].slice(0, HISTORY_CAP);
        set({ lastSavedContent: content, history: nextHistory });
      },

      restoreFromHistory: (entryId) => {
        const entry = get().history.find((h) => h.id === entryId);
        if (entry) set({ content: entry.content });
      },

      resetToDefault: () =>
        set({
          content: DEFAULT_MARKDOWN,
          lastSavedContent: DEFAULT_MARKDOWN,
        }),

      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      toggleTypewriter: () => set((s) => ({ typewriterMode: !s.typewriterMode })),
      toggleDiff: () => set((s) => ({ showDiff: !s.showDiff })),
      toggleLineNumbers: () =>
        set((s) => ({ showLineNumbers: !s.showLineNumbers })),

      setTheme: (t) => set({ theme: t }),
      setActivePanel: (p) =>
        set((s) => ({ activePanel: s.activePanel === p ? "none" : p })),
      setPreviewScale: (s) => set({ previewScale: s }),

      setFindings: (f) => set({ findings: f }),
    }),
    {
      name: "universal-markdown-studio-v1",
      /**
       * Persist schema version.
       *
       * Bump whenever the shape of the persisted subset (see `partialize`)
       * changes incompatibly. The `migrate` function is invoked with whatever
       * is on disk plus that payload's version, and must return a value
       * compatible with the current shape — or throw, in which case persist
       * falls back to initial state.
       */
      version: 1,
      migrate: (persisted: unknown, fromVersion: number) => {
        // No migrations yet. Older schemas (version 0, i.e. pre-versioning
        // saves written before we added this field) are mostly compatible,
        // but any unknown field is tolerated because we spread `persisted`
        // over the initial state via persist's default `merge` strategy.
        // The cast to `MarkdownState` is safe because zustand then merges
        // the result into the initial state, filling any missing fields.
        if (fromVersion === 0 || fromVersion === 1) {
          return persisted as MarkdownState;
        }
        // Future-proofing: if someone downgrades, wipe and start fresh.
        // Returning {} triggers a full fallback to initial state on merge.
        return {} as MarkdownState;
      },
      storage: createJSONStorage(() => {
        // Client: use real localStorage.
        if (typeof window !== "undefined") return window.localStorage;
        // SSR: return a no-op that satisfies the DOM `Storage` interface.
        // We implement every field, not just the three used by Zustand,
        // because TypeScript's `tsc --noEmit` step on Vercel rejects a
        // partial cast here.
        const noop: Storage = {
          length: 0,
          clear: () => {},
          getItem: () => null,
          key: () => null,
          removeItem: () => {},
          setItem: () => {},
        };
        return noop;
      }),
      partialize: (s) => ({
        content: s.content,
        lastSavedContent: s.lastSavedContent,
        history: s.history,
        focusMode: s.focusMode,
        typewriterMode: s.typewriterMode,
        showLineNumbers: s.showLineNumbers,
        theme: s.theme,
      }),
    },
  ),
);
