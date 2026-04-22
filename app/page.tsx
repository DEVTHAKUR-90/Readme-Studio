"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

/**
 * Lazy-load the full workspace on the client. Monaco pulls in browser-only
 * APIs and shouldn't be SSR'd; this keeps the initial server response tiny.
 */
const Workspace = dynamic(() => import("@/components/Workspace"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
        <p className="font-mono text-xs tracking-widest text-neon-cyan/70">
          BOOTING STUDIO
        </p>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <ErrorBoundary>
      <Workspace />
    </ErrorBoundary>
  );
}
