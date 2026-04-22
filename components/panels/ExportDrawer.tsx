"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, Image as ImageIcon, QrCode, Loader2 } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";
import { createSyncClient, type SyncClient } from "@/lib/wsSync";

/**
 * Export drawer offers three deliverables:
 *   1. Raw .md file (blob → anchor)
 *   2. 3D browser-framed PNG (html2canvas)
 *   3. QR pairing for cross-device clipboard sync
 */
export default function ExportDrawer() {
  const content = useMarkdownStore((s) => s.content);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);
  const [busy, setBusy] = useState<"png" | null>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncClient | null>(null);

  useEffect(() => {
    return () => {
      if (pngUrl) URL.revokeObjectURL(pngUrl);
      sync?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadMd = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    setBusy("png");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const target = document.getElementById("preview-root");
      if (!target) throw new Error("preview not mounted");

      // Capture the preview at 2x for retina-crisp output.
      const snap = await html2canvas(target, {
        backgroundColor: "#0d1117",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      // Compose the 3D browser mockup around it.
      const framed = composeBrowserFrame(snap);
      const blob: Blob = await new Promise((resolve, reject) =>
        framed.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
          "image/png",
          0.95,
        ),
      );
      const url = URL.createObjectURL(blob);
      setPngUrl(url);

      // Auto-download.
      const a = document.createElement("a");
      a.href = url;
      a.download = "readme-export.png";
      a.click();
    } catch (e) {
      console.error(e);
      alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const startSync = () => {
    if (sync) {
      sync.close();
      setSync(null);
      return;
    }
    const client = createSyncClient();
    setSync(client);
  };

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader title="Export & Sync" onClose={() => setActivePanel("none")} />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Raw markdown */}
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Raw markdown
          </h3>
          <button className="btn-neon-cyan w-full justify-center" onClick={downloadMd}>
            <FileDown className="h-3.5 w-3.5" /> Download README.md
          </button>
        </section>

        {/* PNG export */}
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            3D browser mockup (PNG)
          </h3>
          <button
            className="btn-neon-pink w-full justify-center"
            onClick={exportPng}
            disabled={busy === "png"}
          >
            {busy === "png" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {busy === "png" ? "Rendering…" : "Export stylized PNG"}
          </button>
          <p className="text-[11px] text-slate-500">
            Captures the current preview, wraps it in a neon-bordered browser
            chrome, and downloads a retina PNG.
          </p>
          {pngUrl && (
            <div className="rounded-lg border border-white/5 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pngUrl} alt="export preview" className="w-full" />
            </div>
          )}
        </section>

        {/* Sync */}
        <section className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Cross-device sync (beta)
          </h3>
          <button
            className={sync ? "btn-neon-pink w-full justify-center" : "btn-ghost w-full justify-center"}
            onClick={startSync}
          >
            <QrCode className="h-3.5 w-3.5" /> {sync ? "Stop pairing" : "Start pairing"}
          </button>
          {sync && (
            <div className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/5 p-3 space-y-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sync.qrUrl}
                alt="pairing QR"
                className="mx-auto rounded border border-white/10 bg-ink-900"
                width={180}
                height={180}
              />
              <div className="font-mono text-[10px] tracking-widest text-slate-400">
                CODE
              </div>
              <div className="font-mono text-xl font-semibold tracking-[0.3em] text-neon-cyan">
                {sync.code}
              </div>
              <p className="text-[11px] text-slate-500">
                Scan on another device to pair. Scaffolded against a public echo
                server — swap the endpoint in <code className="text-neon-cyan">lib/wsSync.ts</code> for production.
              </p>
            </div>
          )}
        </section>

        <div className="rounded-lg border border-white/5 bg-ink-950/50 p-3 text-[11px] text-slate-500 leading-relaxed">
          <Download className="mb-1 h-3 w-3 text-neon-cyan" />
          Exports run entirely client-side; no data is uploaded.
        </div>
      </div>
    </div>
  );
}

// ---- canvas compositing helpers --------------------------------------------

/** Wrap the captured preview in a stylized "browser" frame with neon borders. */
function composeBrowserFrame(snap: HTMLCanvasElement): HTMLCanvasElement {
  const padX = 40;
  const padTop = 90;
  const padBottom = 40;
  const w = snap.width + padX * 2;
  const h = snap.height + padTop + padBottom;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#0a0c12");
  bg.addColorStop(1, "#05060a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Neon border glow
  const glow = ctx.createLinearGradient(0, 0, w, 0);
  glow.addColorStop(0, "rgba(255,45,148,0.8)");
  glow.addColorStop(1, "rgba(34,228,255,0.8)");
  ctx.strokeStyle = glow;
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(34,228,255,0.6)";
  ctx.shadowBlur = 40;
  roundRect(ctx, 16, 16, w - 32, h - 32, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Title bar
  ctx.fillStyle = "#0f1219";
  roundRect(ctx, 32, 32, w - 64, 60, 12, true);

  // Traffic lights
  [
    ["#ff5f57", 60],
    ["#febc2e", 82],
    ["#28c840", 104],
  ].forEach(([color, x]) => {
    ctx.beginPath();
    ctx.arc(x as number, 62, 7, 0, Math.PI * 2);
    ctx.fillStyle = color as string;
    ctx.fill();
  });

  // URL pill
  ctx.fillStyle = "#1e2330";
  roundRect(ctx, 140, 46, w - 220, 32, 8, true);
  ctx.fillStyle = "#7d8590";
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillText("readme.studio/preview", 156, 66);

  // Watermark
  ctx.fillStyle = "rgba(34,228,255,0.8)";
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillText("universal markdown studio", w - 56, 66);
  ctx.textAlign = "left";

  // Preview image
  ctx.drawImage(snap, padX, padTop);

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = false,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}
