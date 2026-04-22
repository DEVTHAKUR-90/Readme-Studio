"use client";

import type { editor } from "monaco-editor";

/**
 * Module-level singleton giving non-editor components (e.g. drawers) access
 * to the live Monaco editor instance so they can insert at the cursor.
 *
 * We intentionally keep this OUT of the Zustand store — Monaco instances
 * hold DOM handles and event emitters that aren't serializable, and we
 * don't want them tripping the `persist` middleware.
 *
 * Lifecycle:
 *   - EditorPane calls `setEditor(instance)` on mount, `setEditor(null)` on unmount.
 *   - Consumers call `insertAtCursor(text)` — a no-op if no editor is mounted.
 */

let instance: editor.IStandaloneCodeEditor | null = null;

export function setEditor(next: editor.IStandaloneCodeEditor | null): void {
  instance = next;
}

export function getEditor(): editor.IStandaloneCodeEditor | null {
  return instance;
}

/**
 * Insert the given text at the current cursor position (or replace the
 * current selection). Returns `true` on success, `false` if no editor is
 * currently mounted — callers may then fall back to appending via the store.
 */
export function insertAtCursor(text: string): boolean {
  const ed = instance;
  if (!ed) return false;

  const selection = ed.getSelection();
  if (!selection) return false;

  ed.executeEdits("drawer-inject", [
    { range: selection, text, forceMoveMarkers: true },
  ]);
  ed.focus();
  return true;
}
