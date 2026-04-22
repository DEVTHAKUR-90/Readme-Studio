"use client";

import type { ReactNode } from "react";
import { ShieldCheck, AlertTriangle, FileWarning, FileCheck } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";
import { cn } from "@/lib/utils";
import type { SecurityFinding } from "@/types";

const SEVERITY_STYLES: Record<
  SecurityFinding["severity"],
  { ring: string; bg: string; text: string; label: string }
> = {
  critical: {
    ring: "border-red-500/50",
    bg: "bg-red-500/10",
    text: "text-red-400",
    label: "CRITICAL",
  },
  high: {
    ring: "border-neon-pink/50",
    bg: "bg-neon-pink/10",
    text: "text-neon-pink",
    label: "HIGH",
  },
  medium: {
    ring: "border-neon-amber/50",
    bg: "bg-neon-amber/10",
    text: "text-neon-amber",
    label: "MEDIUM",
  },
  low: {
    ring: "border-neon-cyan/40",
    bg: "bg-neon-cyan/5",
    text: "text-neon-cyan",
    label: "LOW",
  },
};

export default function SecurityDrawer() {
  const findings = useMarkdownStore((s) => s.findings);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);

  const secrets = findings.filter((f) => f.category === "secret");
  const injections = findings.filter((f) => f.category === "injection");
  const grc = findings.filter((f) => f.category === "grc");

  const critCount = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="DevSecOps & GRC" onClose={() => setActivePanel("none")} />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryTile
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Secrets"
            count={secrets.length}
            tone={secrets.length > 0 ? "pink" : "cyan"}
          />
          <SummaryTile
            icon={<FileWarning className="h-4 w-4" />}
            label="Injection"
            count={injections.length}
            tone={injections.length > 0 ? "pink" : "cyan"}
          />
          <SummaryTile
            icon={<FileCheck className="h-4 w-4" />}
            label="GRC gaps"
            count={grc.length}
            tone={grc.length > 0 ? "amber" : "cyan"}
          />
        </div>

        {findings.length === 0 ? (
          <div className="rounded-xl border border-neon-lime/30 bg-neon-lime/5 p-6 text-center">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-neon-lime" />
            <div className="font-display text-sm tracking-widest text-neon-lime">
              NO FINDINGS
            </div>
            <p className="mt-2 text-xs text-slate-400">
              No secrets, injection vectors, or GRC gaps detected in the current document.
            </p>
          </div>
        ) : (
          <>
            {critCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="font-semibold">{critCount}</span> high-severity
                  finding{critCount === 1 ? "" : "s"}. Rotate any exposed credentials
                  and remove raw scripts before publishing.
                </span>
              </div>
            )}

            <Section title="Secrets & Credentials" findings={secrets} />
            <Section title="Injection Vectors" findings={injections} />
            <Section title="GRC / Compliance" findings={grc} />
          </>
        )}

        <div className="rounded-lg border border-white/5 bg-ink-950/50 p-3 text-[11px] text-slate-500 leading-relaxed">
          <div className="mb-1 font-mono uppercase tracking-widest text-neon-cyan">
            How this works
          </div>
          Regex + entropy heuristics run client-side on every keystroke (debounced).
          Nothing leaves your machine — no network calls, no telemetry.
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  findings,
}: {
  title: string;
  findings: SecurityFinding[];
}) {
  if (findings.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {title} · {findings.length}
      </h3>
      <div className="space-y-2">
        {findings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: SecurityFinding }) {
  const styles = SEVERITY_STYLES[finding.severity];
  return (
    <div className={cn("rounded-lg border p-3 text-xs", styles.ring, styles.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("font-mono text-[9px] tracking-widest", styles.text)}>
              {styles.label}
            </span>
            {finding.line != null && (
              <span className="font-mono text-[9px] text-slate-500">
                LINE {finding.line}
              </span>
            )}
          </div>
          <div className="mt-1 font-medium text-slate-200">{finding.title}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            {finding.detail}
          </p>
          {finding.snippet && (
            <pre className="mt-2 overflow-x-auto rounded bg-ink-950/80 p-2 font-mono text-[10px] text-slate-300">
              {finding.snippet}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  count,
  tone,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  tone: "pink" | "cyan" | "amber";
}) {
  const toneCls = {
    pink: "border-neon-pink/40 text-neon-pink shadow-neon-pink",
    cyan: "border-neon-cyan/40 text-neon-cyan",
    amber: "border-neon-amber/40 text-neon-amber",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-xl border bg-ink-900/60 p-3 text-center transition-all",
        toneCls,
      )}
    >
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-2xl font-bold tabular-nums">{count}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
    </div>
  );
}
