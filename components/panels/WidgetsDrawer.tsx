"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";
import { renderWidgetMarkdown } from "@/lib/widgets";
import { insertAtCursor } from "@/lib/editorBridge";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types";

const WIDGET_KINDS: Array<{ id: WidgetConfig["kind"]; label: string; hint: string }> = [
  { id: "github-stats", label: "GitHub Stats", hint: "Commits, stars, PRs" },
  { id: "streak-stats", label: "Streak Stats", hint: "Commit streaks" },
  { id: "top-langs", label: "Top Languages", hint: "Language breakdown" },
  { id: "wakatime", label: "WakaTime", hint: "Coding time tracked" },
  { id: "activity-graph", label: "Activity Graph", hint: "Contribution graph" },
  { id: "trophies", label: "Trophies", hint: "Profile achievements" },
];

const THEME_PRESETS = [
  "tokyonight",
  "radical",
  "dracula",
  "gruvbox",
  "onedark",
  "merko",
  "synthwave",
  "highcontrast",
];

const HEX_PRESETS = ["#22E4FF", "#FF2D94", "#B7FF4A", "#FFB547", "#A78BFA", "#F472B6"];

export default function WidgetsDrawer() {
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);
  const content = useMarkdownStore((s) => s.content);
  const setContent = useMarkdownStore((s) => s.setContent);

  const [cfg, setCfg] = useState<WidgetConfig>({
    id: "w-1",
    kind: "github-stats",
    username: "octocat",
    theme: "tokyonight",
    hexPrimary: "#22E4FF",
    hexBg: "#0D1117",
    showIcons: true,
    hideBorder: true,
  });

  const preview = renderWidgetMarkdown(cfg);
  const imgUrl = preview.match(/\((.*?)\)/)?.[1] ?? "";

  // Detect whether the rendered widget's URL (or any widget of the same kind)
  // already appears in the current markdown — drives the Delete button.
  const alreadyInjected = useMemo(() => {
    if (!imgUrl) return false;
    // Match by host path prefix (without theme/color) so we can delete even
    // after the user changes colors.
    const urlCore = imgUrl.split("?")[0];
    return content.includes(urlCore);
  }, [imgUrl, content]);

  const inject = () => {
    // Cursor-aware insertion is preferred; store-level append is the fallback
    // in case the editor isn't mounted (e.g. during teardown).
    const ok = insertAtCursor(`\n\n${preview}\n`);
    if (!ok) {
      setContent(`${content}\n\n${preview}\n`);
    }
  };

  /**
   * Remove every markdown image line whose URL matches this widget's host
   * path prefix. Runs a line-level rewrite so surrounding text is unaffected.
   */
  const removeFromReadme = () => {
    if (!imgUrl) return;
    const urlCore = imgUrl.split("?")[0];
    const filtered = content
      .split("\n")
      .filter((line) => !line.includes(urlCore))
      .join("\n")
      // Collapse 3+ blank lines left behind by the removal.
      .replace(/\n{3,}/g, "\n\n");
    setContent(filtered);
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="Widget Builder" onClose={() => setActivePanel("none")} />
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Kind */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Widget type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_KINDS.map((k) => (
              <button
                key={k.id}
                onClick={() => setCfg({ ...cfg, kind: k.id })}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-all",
                  cfg.kind === k.id
                    ? "border-neon-cyan/60 bg-neon-cyan/10 shadow-neon-cyan"
                    : "border-white/5 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <div className="text-xs font-medium text-slate-200">{k.label}</div>
                <div className="text-[10px] text-slate-500">{k.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            GitHub username
          </label>
          <input
            className="input-base font-mono"
            value={cfg.username}
            onChange={(e) => setCfg({ ...cfg, username: e.target.value })}
          />
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Theme preset
          </label>
          <div className="flex flex-wrap gap-1">
            {THEME_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => setCfg({ ...cfg, theme: t })}
                className={cn(
                  "chip transition-colors",
                  cfg.theme === t
                    ? "bg-neon-cyan/20 text-neon-cyan ring-1 ring-neon-cyan/50"
                    : "bg-white/5 text-slate-400 hover:bg-white/10",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Accent
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cfg.hexPrimary}
                onChange={(e) => setCfg({ ...cfg, hexPrimary: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                className="input-base font-mono text-[11px]"
                value={cfg.hexPrimary}
                onChange={(e) => setCfg({ ...cfg, hexPrimary: e.target.value })}
              />
            </div>
            <div className="flex gap-1">
              {HEX_PRESETS.map((h) => (
                <button
                  key={h}
                  onClick={() => setCfg({ ...cfg, hexPrimary: h })}
                  className="h-5 w-5 rounded-full border border-white/10"
                  style={{ backgroundColor: h }}
                  aria-label={h}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cfg.hexBg}
                onChange={(e) => setCfg({ ...cfg, hexBg: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                className="input-base font-mono text-[11px]"
                value={cfg.hexBg}
                onChange={(e) => setCfg({ ...cfg, hexBg: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.showIcons}
              onChange={(e) => setCfg({ ...cfg, showIcons: e.target.checked })}
              className="accent-neon-cyan"
            />
            Show icons
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={cfg.hideBorder}
              onChange={(e) => setCfg({ ...cfg, hideBorder: e.target.checked })}
              className="accent-neon-cyan"
            />
            Hide border
          </label>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Live preview
          </label>
          <WidgetPreview url={imgUrl} username={cfg.username} />
          <pre className="overflow-x-auto rounded bg-ink-950/80 p-2 font-mono text-[10px] text-slate-400 border border-white/5">
            {preview}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-neon-cyan justify-center" onClick={inject}>
            <Plus className="h-3.5 w-3.5" />
            <span>Inject</span>
          </button>
          <button
            className={cn("justify-center", alreadyInjected ? "btn-danger" : "btn-ghost")}
            onClick={removeFromReadme}
            disabled={!alreadyInjected}
            title={
              alreadyInjected
                ? "Remove every instance of this widget from the README"
                : "This widget isn't currently in the README"
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
        {alreadyInjected && (
          <p className="text-[10px] text-neon-lime/80 font-mono">
            ✓ This widget is currently in your README
          </p>
        )}

        <div className="rounded-lg border border-white/5 bg-ink-950/50 p-3 text-[11px] text-slate-500 leading-relaxed">
          <div className="mb-1 flex items-center gap-1 font-mono uppercase tracking-widest text-neon-cyan">
            <Layers className="h-3 w-3" /> Providers
          </div>
          Widgets use the community-standard hosts{" "}
          <span className="text-slate-300">github-readme-stats.vercel.app</span>,{" "}
          <span className="text-slate-300">streak-stats.demolab.com</span> and{" "}
          <span className="text-slate-300">github-profile-trophy.vercel.app</span>.
        </div>
      </div>
    </div>
  );
}

/**
 * Widget live-preview component.
 *
 * Handles three states so we never show a broken image or a "file an issue"
 * shields.io error card in the UI:
 *
 *   1. `empty`   — no username typed; prompt the user
 *   2. `loading` — username valid, image not yet loaded (skeleton)
 *   3. `ok`      — image loaded (render)
 *   4. `error`   — image failed (e.g. non-existent GitHub user); show friendly hint
 */
function WidgetPreview({ url, username }: { url: string; username: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  // Validate username: GitHub allows 1-39 chars, alphanumeric + dashes (no
  // consecutive dashes, no leading/trailing dash).
  const validUsername =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username.trim());

  if (!username.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/60 p-6 text-center text-xs text-slate-500 min-h-[120px] flex items-center justify-center">
        Enter a GitHub username to preview the widget.
      </div>
    );
  }

  if (!validUsername) {
    return (
      <div className="rounded-lg border border-neon-pink/30 bg-neon-pink/5 p-4 text-center text-xs text-neon-pink min-h-[120px] flex items-center justify-center font-mono">
        &quot;{username}&quot; doesn&apos;t look like a valid GitHub username.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-ink-950/60 p-3 flex items-center justify-center min-h-[120px] relative">
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-2 w-3/4">
            <div className="h-3 rounded bg-white/5 animate-pulse" />
            <div className="h-3 rounded bg-white/5 animate-pulse w-5/6" />
            <div className="h-3 rounded bg-white/5 animate-pulse w-2/3" />
          </div>
        </div>
      )}
      {state === "error" && (
        <div className="text-[11px] text-neon-pink text-center font-mono px-3">
          Couldn&apos;t load widget. The user might not exist, or the provider may
          have rate-limited. The markdown will still work in your README.
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        // keying on url forces a fresh fetch when config changes
        key={url}
        src={url}
        alt={`${username} widget preview`}
        loading="lazy"
        onLoad={() => setState("ok")}
        onError={() => setState("error")}
        className={cn(
          "max-w-full transition-opacity",
          state === "ok" ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

