/**
 * Parse ATX-style headings from markdown and generate a GitHub-compatible
 * table of contents. Code fences are respected so `## not-a-heading` inside
 * a fenced block does not become an entry.
 */

export interface TocHeading {
  level: number; // 1..6
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "") // strip inline html
    .replace(/[`*_~]/g, "")
    .replace(/[^\w\s\-\u00C0-\uFFFF]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractHeadings(markdown: string): TocHeading[] {
  const lines = markdown.split("\n");
  const headings: TocHeading[] = [];
  let inFence = false;
  const fenceRx = /^(```|~~~)/;

  for (const line of lines) {
    if (fenceRx.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;

    const level = m[1].length;
    const text = m[2].trim();
    headings.push({ level, text, slug: slugify(text) });
  }

  // GitHub disambiguates duplicate slugs by appending `-1`, `-2`, …
  const counts = new Map<string, number>();
  for (const h of headings) {
    const n = counts.get(h.slug) ?? 0;
    if (n > 0) h.slug = `${h.slug}-${n}`;
    counts.set(h.slug, n + 1);
  }
  return headings;
}

/**
 * Render a markdown TOC from a list of headings. The minimum level is used as
 * the baseline indentation so that TOCs don't start with awkward nested lists
 * when the document's first heading is H2 rather than H1.
 */
export function renderToc(headings: TocHeading[]): string {
  if (headings.length === 0) return "";
  const min = Math.min(...headings.map((h) => h.level));
  const lines = headings.map((h) => {
    const indent = "  ".repeat(h.level - min);
    return `${indent}- [${h.text}](#${h.slug})`;
  });
  return ["## Table of contents", "", ...lines, ""].join("\n");
}

/**
 * Build a TOC for the given markdown. Returns empty string when no headings
 * exist so callers can short-circuit cleanly.
 */
export function buildToc(markdown: string): string {
  return renderToc(extractHeadings(markdown));
}
