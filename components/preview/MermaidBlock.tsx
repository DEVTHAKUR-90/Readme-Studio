"use client";

import { useEffect, useRef, useState } from "react";
import { useMarkdownStore } from "@/store/useMarkdownStore";

/**
 * Client-side Mermaid renderer.
 *
 * `mermaid` can't run during SSR (it needs `document`). We import it lazily
 * the first time a diagram is mounted and cache the instance. Errors are
 * caught and rendered as inline diagnostic text rather than propagating and
 * breaking the rest of the preview.
 */
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  return mermaidPromise;
}

let diagramCounter = 0;

export function MermaidBlock({ code }: { code: string }) {
  const theme = useMarkdownStore((s) => s.theme);
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const mermaid = await loadMermaid();
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          fontFamily: "JetBrains Mono, monospace",
          themeVariables:
            theme === "dark"
              ? {
                  primaryColor: "#0f1219",
                  primaryTextColor: "#e6edf3",
                  primaryBorderColor: "#22e4ff",
                  lineColor: "#7d8590",
                  secondaryColor: "#1e2330",
                  tertiaryColor: "#0a0c12",
                }
              : {},
        });
        const id = `mmd-${++diagramCounter}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  if (err) {
    return (
      <div className="mermaid-container text-xs text-red-400">
        <div className="font-mono">mermaid render error:</div>
        <pre className="whitespace-pre-wrap">{err}</pre>
      </div>
    );
  }
  return <div className="mermaid-container" ref={ref} />;
}
