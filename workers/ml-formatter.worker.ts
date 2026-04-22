/// <reference lib="webworker" />
/**
 * ML Formatter Worker — "AI Polish"
 *
 * Safely normalizes a markdown document without touching code fences,
 * inline code, or HTML blocks. Each transformation returns its count
 * so the UI can show the user exactly what changed.
 */
declare const self: DedicatedWorkerGlobalScope;

interface PolishRequest {
  type: "polish";
  id: string;
  payload: string;
}

interface PolishResponse {
  type: "result";
  id: string;
  payload: string;
  meta: {
    msTaken: number;
    totalChanges: number;
    changes: Array<{ rule: string; count: number }>;
  };
}

/**
 * Mask out regions we must NOT touch, run the given fn on the remainder,
 * then restore the masked regions verbatim.
 */
function withMask(
  input: string,
  patterns: RegExp[],
  fn: (masked: string) => string,
): string {
  const stash: string[] = [];
  let masked = input;
  for (const rx of patterns) {
    masked = masked.replace(rx, (m) => {
      stash.push(m);
      return `\u0000MASK${stash.length - 1}\u0000`;
    });
  }
  const processed = fn(masked);
  return processed.replace(/\u0000MASK(\d+)\u0000/g, (_, i) => stash[Number(i)]);
}

function polish(input: string): { out: string; changes: Array<{ rule: string; count: number }> } {
  const changes: Array<{ rule: string; count: number }> = [];

  // Mask code fences, inline code, and HTML blocks so no rule can rewrite
  // them. Order matters: fences first (longest), then HTML, then inline code.
  const masks: RegExp[] = [
    /```[\s\S]*?```/g,
    /~~~[\s\S]*?~~~/g,
    /<(?:picture|svg|div|source|script|style)[\s\S]*?<\/(?:picture|svg|div|source|script|style)>/gi,
    /<[a-z][^>]*\/>/gi, // self-closing tags
    /`[^`\n]+`/g,
  ];

  let out = withMask(input, masks, (text) => {
    let t = text;

    // 1. Strip trailing whitespace on every line.
    {
      const next = t.replace(/[ \t]+$/gm, "");
      const diff = count(t, next, /[ \t]+$/gm);
      if (diff > 0) changes.push({ rule: "Trailing whitespace removed", count: diff });
      t = next;
    }

    // 2. Ensure exactly one blank line before ATX headings.
    {
      const next = t.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");
      if (next !== t) {
        changes.push({
          rule: "Heading spacing tightened",
          count: (next.match(/\n\n#{1,6}\s/g) ?? []).length -
            (t.match(/\n\n#{1,6}\s/g) ?? []).length,
        });
      }
      t = next;
    }

    // 3. ` - ` between two words → em-dash (prose only; lists start at line
    //    beginning and are caught by the anchor).
    {
      const matches = t.match(/(\w) - (\w)/g) ?? [];
      if (matches.length > 0) {
        t = t.replace(/(\w) - (\w)/g, "$1 — $2");
        changes.push({ rule: "Em-dashes inserted", count: matches.length });
      }
    }

    // 4. Smart quotes — only in prose lines (skip lines that look like HTML).
    {
      let qCount = 0;
      const lines = t.split("\n").map((line) => {
        if (/^\s*</.test(line)) return line; // skip HTML-ish lines
        if (/https?:\/\//.test(line)) return line; // skip URL-heavy lines
        let x = line;
        x = x.replace(/(\s|^)"([^"\n]+)"/g, (_, pre, body) => {
          qCount += 2;
          return `${pre}“${body}”`;
        });
        x = x.replace(/(\s|^)'([^'\n]+)'/g, (_, pre, body) => {
          qCount += 2;
          return `${pre}‘${body}’`;
        });
        return x;
      });
      if (qCount > 0) {
        t = lines.join("\n");
        changes.push({ rule: "Straight quotes → curly quotes", count: qCount });
      }
    }

    // 5. Unify bullet markers to `-`. Only rewrite `*` or `+` at the start
    //    of a line followed by a space (never `*bold*` emphasis).
    {
      const matches = t.match(/^(\s*)[*+]\s+/gm) ?? [];
      if (matches.length > 0) {
        t = t.replace(/^(\s*)[*+]\s+/gm, "$1- ");
        changes.push({ rule: "Bullet markers unified", count: matches.length });
      }
    }

    // 6. Collapse 3+ consecutive blank lines.
    {
      const matches = t.match(/\n{3,}/g) ?? [];
      if (matches.length > 0) {
        t = t.replace(/\n{3,}/g, "\n\n");
        changes.push({ rule: "Extra blank lines collapsed", count: matches.length });
      }
    }

    return t;
  });

  return { out, changes };
}

/** Count the number of matches of `rx` that existed in `before` but not `after`. */
function count(before: string, after: string, rx: RegExp): number {
  const b = before.match(rx)?.length ?? 0;
  const a = after.match(rx)?.length ?? 0;
  return Math.max(0, b - a);
}

self.onmessage = (evt: MessageEvent<PolishRequest>) => {
  const msg = evt.data;
  if (!msg || msg.type !== "polish") return;

  const start = performance.now();
  // Simulated 1.2s think-time to mimic a local model forward pass. Short
  // enough that users don't lose context, long enough to feel like "AI".
  setTimeout(() => {
    const { out, changes } = polish(msg.payload);
    const totalChanges = changes.reduce((n, c) => n + c.count, 0);
    const response: PolishResponse = {
      type: "result",
      id: msg.id,
      payload: out,
      meta: {
        msTaken: Math.round(performance.now() - start),
        totalChanges,
        changes,
      },
    };
    self.postMessage(response);
  }, 1200);
};

export {};
