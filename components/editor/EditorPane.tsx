"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import { FileText, CircleDot, RotateCcw } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { diffLines } from "@/lib/diff";
import { setEditor } from "@/lib/editorBridge";
import { cn } from "@/lib/utils";

/**
 * Mock asset pipeline – intercepts paste/drop and "uploads" the file.
 * Returns a data-URL immediately (good enough for preview) plus a stable
 * filename so the markdown reference is stable across renders.
 */
async function mockUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("upload failed"));
    reader.readAsDataURL(file);
  });
}

export default function EditorPane() {
  const content = useMarkdownStore((s) => s.content);
  const setContent = useMarkdownStore((s) => s.setContent);
  const focusMode = useMarkdownStore((s) => s.focusMode);
  const typewriterMode = useMarkdownStore((s) => s.typewriterMode);
  const showDiff = useMarkdownStore((s) => s.showDiff);
  const lastSavedContent = useMarkdownStore((s) => s.lastSavedContent);
  const showLineNumbers = useMarkdownStore((s) => s.showLineNumbers);
  const theme = useMarkdownStore((s) => s.theme);
  const resetToDefault = useMarkdownStore((s) => s.resetToDefault);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const focusDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(
    null,
  );
  const disposablesRef = useRef<IDisposable[]>([]);
  // Live-update ref mirror of typewriter mode so the Monaco cursor handler
  // (registered once at mount) sees the current value. Without this the
  // closure captures `false` at mount and toggling does nothing.
  const typewriterRef = useRef(typewriterMode);
  useEffect(() => {
    typewriterRef.current = typewriterMode;
  }, [typewriterMode]);
  const [wordCount, setWordCount] = useState(0);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  // --- Monaco mount --------------------------------------------------------
  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;

    // Publish the instance to the module-level bridge so drawers (Widgets,
    // TechStack, …) can insert at the cursor instead of appending to the end
    // of the document.
    setEditor(instance);

    // Custom dark theme that matches the studio aesthetic.
    monaco.editor.defineTheme("universal-md-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "7d8590", fontStyle: "italic" },
        { token: "keyword", foreground: "ff2d94" },
        { token: "string", foreground: "b7ff4a" },
        { token: "number", foreground: "22e4ff" },
      ],
      colors: {
        "editor.background": "#0a0c12",
        "editor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#3a4252",
        "editorLineNumber.activeForeground": "#22e4ff",
        "editor.lineHighlightBackground": "#10131c",
        "editor.selectionBackground": "#22e4ff30",
        "editor.selectionHighlightBackground": "#22e4ff18",
        "editorCursor.foreground": "#ff2d94",
        "editor.findMatchBackground": "#ff2d9440",
        "editor.findMatchHighlightBackground": "#ff2d9420",
        "editorIndentGuide.background": "#1e2330",
        "editorIndentGuide.activeBackground": "#2a3040",
        "editorWidget.background": "#0f1219",
        "editorWidget.border": "#2a3040",
        "editorSuggestWidget.background": "#0f1219",
        "editorSuggestWidget.border": "#2a3040",
        "editorSuggestWidget.selectedBackground": "#22e4ff20",
      },
    });
    // Matching light theme — keyword/string/number stay accent-colored so
    // the "studio" identity is preserved, but against a GitHub-light canvas.
    monaco.editor.defineTheme("universal-md-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6e7781", fontStyle: "italic" },
        { token: "keyword", foreground: "c2185b" },
        { token: "string", foreground: "3c8a0f" },
        { token: "number", foreground: "0b8fa8" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2328",
        "editorLineNumber.foreground": "#8c959f",
        "editorLineNumber.activeForeground": "#0b8fa8",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editor.selectionBackground": "#0b8fa833",
        "editor.selectionHighlightBackground": "#0b8fa81a",
        "editorCursor.foreground": "#c2185b",
        "editor.findMatchBackground": "#c2185b40",
        "editor.findMatchHighlightBackground": "#c2185b20",
        "editorIndentGuide.background": "#eaeef2",
        "editorIndentGuide.activeBackground": "#d0d7de",
        "editorWidget.background": "#ffffff",
        "editorWidget.border": "#d0d7de",
        "editorSuggestWidget.background": "#ffffff",
        "editorSuggestWidget.border": "#d0d7de",
        "editorSuggestWidget.selectedBackground": "#0b8fa822",
      },
    });
    // Pick the theme that matches the store's current mode. The dedicated
    // useEffect below keeps it in sync when the user toggles later.
    const initialTheme =
      useMarkdownStore.getState().theme === "light"
        ? "universal-md-light"
        : "universal-md-dark";
    monaco.editor.setTheme(initialTheme);

    // Cursor + selection tracking → powers typewriter + status bar.
    disposablesRef.current.push(
      instance.onDidChangeCursorPosition((e) => {
        setCursor({ line: e.position.lineNumber, column: e.position.column });
        // Read from ref — `typewriterMode` in a closure captured at mount
        // would be stale after the user toggles the mode.
        if (typewriterRef.current) {
          const top =
            instance.getTopForLineNumber(e.position.lineNumber) -
            instance.getLayoutInfo().height / 2;
          instance.setScrollTop(Math.max(0, top), 1);
        }
      }),
    );

    // Paste intercept → mock upload for images.
    const container = instance.getContainerDomNode();
    const onPaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length === 0) return;
      e.preventDefault();
      await insertFiles(files);
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (container) container.style.outline = "2px dashed rgba(34,228,255,0.5)";
    };
    const onDragLeave = () => {
      if (container) container.style.outline = "";
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (container) container.style.outline = "";
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (files.length > 0) await insertFiles(files);
    };

    container?.addEventListener("paste", onPaste);
    container?.addEventListener("dragover", onDragOver);
    container?.addEventListener("dragleave", onDragLeave);
    container?.addEventListener("drop", onDrop);

    disposablesRef.current.push({
      dispose() {
        container?.removeEventListener("paste", onPaste);
        container?.removeEventListener("dragover", onDragOver);
        container?.removeEventListener("dragleave", onDragLeave);
        container?.removeEventListener("drop", onDrop);
      },
    } as IDisposable);
  };

  /** Insert one or more uploaded images at the cursor. */
  const insertFiles = async (files: File[]) => {
    const instance = editorRef.current;
    if (!instance) return;
    for (const file of files) {
      const url = await mockUpload(file);
      const alt = file.name.replace(/\.[^.]+$/, "");
      const snippet = `\n![${alt}](${url})\n`;
      const sel = instance.getSelection();
      if (!sel) continue;
      instance.executeEdits("asset-pipeline", [
        { range: sel, text: snippet, forceMoveMarkers: true },
      ]);
    }
  };

  // --- Focus mode decorations (fade all but the current + neighbor lines) --
  useEffect(() => {
    const instance = editorRef.current;
    const monaco = monacoRef.current;
    if (!instance || !monaco) return;

    // Helper: ensure a collection exists and return it.
    const ensure = (): editor.IEditorDecorationsCollection => {
      if (!focusDecorationsRef.current) {
        focusDecorationsRef.current = instance.createDecorationsCollection();
      }
      return focusDecorationsRef.current;
    };

    if (!focusMode) {
      focusDecorationsRef.current?.clear();
      return;
    }

    const apply = () => {
      const pos = instance.getPosition();
      if (!pos) return;
      const totalLines = instance.getModel()?.getLineCount() ?? 0;
      const radius = 2;
      const decos: editor.IModelDeltaDecoration[] = [];
      for (let i = 1; i <= totalLines; i++) {
        if (Math.abs(i - pos.lineNumber) > radius) {
          decos.push({
            range: new monaco.Range(i, 1, i, 1),
            options: {
              isWholeLine: true,
              inlineClassName: "md-focus-faded",
            },
          });
        }
      }
      // `set` atomically replaces the collection's contents — no manual
      // diffing and no deprecated `deltaDecorations` call.
      ensure().set(decos);
    };

    apply();
    const sub = instance.onDidChangeCursorPosition(apply);
    return () => sub.dispose();
  }, [focusMode]);

  // Word count – cheap enough to recompute on every change.
  useEffect(() => {
    setWordCount(
      content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0,
    );
  }, [content]);

  // Dispose listeners on unmount and clear the editor bridge singleton so
  // drawers don't try to insert into an unmounted Monaco instance.
  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];
      setEditor(null);
    };
  }, []);

  // Sync Monaco's active theme with the studio theme. Both themes are
  // defined once at mount; this effect only swaps between them.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.setTheme(
      theme === "light" ? "universal-md-light" : "universal-md-dark",
    );
  }, [theme]);

  // Inject focus-mode CSS once.
  useEffect(() => {
    const id = "md-focus-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .md-focus-faded { opacity: 0.25 !important; transition: opacity 200ms ease; }
    `;
    document.head.appendChild(style);
  }, []);

  // --- Diff operations ----------------------------------------------------
  const diffOps = useMemo(() => {
    if (!showDiff) return null;
    return diffLines(lastSavedContent, content);
  }, [showDiff, lastSavedContent, content]);

  return (
    <div className="frame-3d relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-neon-cyan" />
          <span className="font-display text-[11px] tracking-widest text-slate-300">
            README.md
          </span>
          <span className="chip bg-neon-cyan/10 text-neon-cyan">MARKDOWN</span>
          <button
            onClick={() => {
              if (
                confirm(
                  "Reset the editor to the default welcome markdown? This creates a new history entry so you can restore anytime.",
                )
              ) {
                resetToDefault();
              }
            }}
            className="ml-1 grid h-5 w-5 place-items-center rounded text-slate-500 hover:text-neon-pink hover:bg-neon-pink/10 transition-colors"
            title="Reset to default README"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>{wordCount} words</span>
          <span>
            {cursor.line}:{cursor.column}
          </span>
          <span className="flex items-center gap-1">
            <CircleDot className="h-2 w-2 text-neon-lime animate-pulse" /> live
          </span>
        </div>
      </div>

      {/* Body: editor OR diff */}
      <div className={cn("relative flex-1 overflow-hidden", focusMode && "focus-fade")}>
        {showDiff && diffOps ? (
          <DiffView ops={diffOps} />
        ) : (
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            theme="universal-md-dark"
            onChange={(v) => setContent(v ?? "")}
            onMount={handleMount}
            options={{
              fontFamily: "JetBrains Mono, Fira Code, monospace",
              fontSize: 13,
              fontLigatures: true,
              lineHeight: 1.7,
              minimap: { enabled: false },
              lineNumbers: showLineNumbers ? "on" : "off",
              wordWrap: "on",
              wrappingIndent: "same",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              scrollBeyondLastLine: true,
              padding: { top: 16, bottom: 320 },
              renderLineHighlight: "gutter",
              bracketPairColorization: { enabled: true },
              unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
              scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
              },
              // Stop Monaco from intercepting our paste/drop.
              dropIntoEditor: { enabled: false },
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Two-column (actually line-stacked) diff view. */
function DiffView({ ops }: { ops: ReturnType<typeof diffLines> }) {
  return (
    <div className="h-full overflow-auto bg-ink-950/40 p-4 font-mono text-[12px] leading-[1.6]">
      <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 bg-[#3fb950]" /> added
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 bg-[#f85149]" /> removed
        </span>
        <span className="text-slate-600">· vs last saved snapshot</span>
      </div>
      {ops.map((op, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre-wrap break-words",
            op.type === "add" && "diff-added text-[#3fb950]",
            op.type === "remove" && "diff-removed text-[#f85149]",
            op.type === "equal" && "text-slate-400",
          )}
        >
          <span className="mr-2 select-none opacity-40">
            {op.type === "add" ? "+" : op.type === "remove" ? "−" : " "}
          </span>
          {op.value || " "}
        </div>
      ))}
    </div>
  );
}
