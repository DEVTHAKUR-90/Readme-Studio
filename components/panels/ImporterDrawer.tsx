"use client";

import { useState } from "react";
import { Github, Download, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { fetchGitHubReadme } from "@/lib/githubImporter";

const PRESETS = [
  { label: "facebook/react", value: "facebook/react" },
  { label: "vercel/next.js", value: "vercel/next.js" },
  { label: "microsoft/vscode", value: "microsoft/vscode" },
  { label: "anthropics/anthropic-sdk-python", value: "anthropics/anthropic-sdk-python" },
];

export default function ImporterDrawer() {
  const setContent = useMarkdownStore((s) => s.setContent);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFetch = async (target?: string) => {
    const value = target ?? url;
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchGitHubReadme(value);
      setContent(res.content);
      setSuccess(
        `Imported ${res.owner}/${res.repo}${res.branch ? `@${res.branch}` : ""} (${(res.size / 1024).toFixed(1)} kB)`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="GitHub Importer" onClose={() => setActivePanel("none")} />
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Repository URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="https://github.com/owner/repo"
              className="input-base font-mono"
            />
            <button
              onClick={() => handleFetch()}
              disabled={busy || !url.trim()}
              className="btn-neon-cyan whitespace-nowrap"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Fetch
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Accepts full URLs, <code className="text-neon-cyan">owner/repo</code>, or
            branch URLs like <code className="text-neon-cyan">.../tree/dev</code>.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-mono">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-neon-lime/40 bg-neon-lime/10 p-3 text-xs text-neon-lime">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-mono">{success}</span>
          </div>
        )}

        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Trending repositories
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setUrl(preset.value);
                  handleFetch(preset.value);
                }}
                disabled={busy}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-300 hover:border-neon-cyan/40 hover:bg-neon-cyan/5 transition-colors"
              >
                <span className="font-mono text-xs">{preset.label}</span>
                <Download className="h-3 w-3 text-slate-500 group-hover:text-neon-cyan" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-ink-950/50 p-3 text-[11px] text-slate-500 leading-relaxed">
          <div className="mb-1 flex items-center gap-1 font-mono uppercase tracking-widest text-neon-cyan">
            <Github className="h-3 w-3" /> API notes
          </div>
          Uses the unauthenticated public GitHub REST API. Anonymous callers are
          capped at 60 requests / hour per IP — you&apos;ll see a rate-limit message
          if you import too many repos at once.
        </div>
      </div>
    </div>
  );
}

export function DrawerHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
      <h2 className="font-display text-sm font-semibold tracking-widest text-slate-200">
        {title.toUpperCase()}
      </h2>
      <button
        onClick={onClose}
        className="rounded-lg border border-white/5 p-1 text-slate-400 hover:border-neon-pink/40 hover:text-neon-pink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
