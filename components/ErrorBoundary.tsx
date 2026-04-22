"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary for the studio shell.
 *
 * React's default behavior on an unhandled render error is to unmount the
 * entire tree — the user sees a blank page and has no way to recover. This
 * boundary catches those errors, logs them to the console (so they're still
 * debuggable), and renders a "something went wrong" panel with a reload
 * button that also purges potentially-corrupt persisted state.
 *
 * We deliberately do NOT report to any remote service — there's no backend.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the devtools console. Next.js's own overlay also shows these.
    // eslint-disable-next-line no-console
    console.error("[studio] render crash:", error, info.componentStack);
  }

  private handleReload = () => {
    // Soft reload — keep localStorage so users don't lose their README.
    window.location.reload();
  };

  private handleHardReset = () => {
    if (
      confirm(
        "Clear persisted state (content, history, settings) and reload? Your current README will be lost.",
      )
    ) {
      try {
        localStorage.removeItem("universal-markdown-studio-v1");
      } catch {
        /* storage may be blocked; reload anyway */
      }
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-screen w-screen items-center justify-center p-6">
        <div className="drawer-solid max-w-lg w-full rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-neon-pink/10 ring-1 ring-neon-pink/40">
              <AlertTriangle className="h-5 w-5 text-neon-pink" />
            </div>
            <div>
              <h1 className="font-display text-sm tracking-widest text-slate-100">
                SOMETHING WENT WRONG
              </h1>
              <p className="font-mono text-[11px] text-slate-500">
                The studio hit an unexpected error.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/5 bg-ink-950/70 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Error
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-red-400">
              {this.state.error.name}: {this.state.error.message}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={this.handleReload}
              className="btn-neon-cyan justify-center"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Reload
            </button>
            <button
              onClick={this.handleHardReset}
              className="btn-ghost justify-center"
            >
              Hard reset
            </button>
          </div>

          <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
            Reload keeps your saved content. Hard reset clears everything this
            app has persisted in your browser (usually only needed if the
            crash reproduces after a reload).
          </p>
        </div>
      </div>
    );
  }
}
