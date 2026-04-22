"use client";

import { useEffect } from "react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { scanMarkdown } from "@/lib/securityScanner";

/**
 * Continuously scan `content` and push findings into the store.
 * Debounced so that typing doesn't thrash the regex engine.
 */
export function useSecurityScanner(delay = 600): void {
  const content = useMarkdownStore((s) => s.content);
  const setFindings = useMarkdownStore((s) => s.setFindings);

  useEffect(() => {
    const t = setTimeout(() => {
      setFindings(scanMarkdown(content));
    }, delay);
    return () => clearTimeout(t);
  }, [content, delay, setFindings]);
}
