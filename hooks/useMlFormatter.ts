"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uid } from "@/lib/utils";

/**
 * Shape of the worker's result — mirrors `PolishResponse.meta` in
 * `workers/ml-formatter.worker.ts`. Duplicated here (rather than imported) to
 * avoid pulling webworker-only types into the main bundle.
 */
export interface PolishMeta {
  msTaken: number;
  totalChanges: number;
  changes: Array<{ rule: string; count: number }>;
}

export interface PolishResult {
  text: string;
  meta: PolishMeta;
}

/**
 * `useMlFormatter` spins up the AI-polish worker and exposes a promise-based
 * `polish(text)` method. The worker instance is reused for the lifetime of
 * the hook to avoid recreating the isolated context on every call.
 *
 * Callers get both the transformed text and a human-readable change list so
 * the UI can surface exactly what "AI Polish" did — the original version
 * returned only the transformed text, which made the feature feel opaque.
 */
export function useMlFormatter() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<
    Map<
      string,
      {
        resolve: (out: PolishResult) => void;
        reject: (e: Error) => void;
      }
    >
  >(new Map());

  const [busy, setBusy] = useState(false);
  const [lastMeta, setLastMeta] = useState<PolishMeta | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Next 14 / webpack understand the `new URL(…, import.meta.url)` dance
    // and will emit a properly-chunked worker bundle.
    const worker = new Worker(
      new URL("../workers/ml-formatter.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (evt: MessageEvent) => {
      const msg = evt.data as {
        type: string;
        id: string;
        payload: string;
        meta: PolishMeta;
      };
      if (msg?.type !== "result") return;

      const pending = pendingRef.current.get(msg.id);
      if (!pending) return;

      pendingRef.current.delete(msg.id);
      setLastMeta(msg.meta);
      setBusy(pendingRef.current.size > 0);
      pending.resolve({ text: msg.payload, meta: msg.meta });
    };

    worker.onerror = (e) => {
      // Reject every in-flight job so callers don't hang forever.
      pendingRef.current.forEach((p) => p.reject(new Error(e.message)));
      pendingRef.current.clear();
      setBusy(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const polish = useCallback((text: string): Promise<PolishResult> => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("AI worker not ready"));

    const id = uid("job");
    const job = new Promise<PolishResult>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
    });
    setBusy(true);
    worker.postMessage({ type: "polish", id, payload: text });
    return job;
  }, []);

  return { polish, busy, lastMeta };
}
