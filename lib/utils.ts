import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind classes intelligently.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Simple debounce helper used by scanners and auto-save.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay = 400,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Uniqueish id generator (no external dep).
 */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * The default welcome markdown the studio ships with.
 * Deliberately exercises every rendering path (headings, tables, task-lists,
 * math, mermaid, raw SVG, <picture>, code fences).
 */
export const DEFAULT_MARKDOWN = `<div align="center">

# ⚡ Universal Markdown Studio

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&pause=1000&color=22E4FF&center=true&vCenter=true&width=520&lines=Ship+READMEs+like+a+principal+engineer.;GitHub+parity+preview.;DevSecOps+%2B+GRC+built-in." />
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=22&pause=1000&color=FF2D94&center=true&vCenter=true&width=520&lines=Ship+READMEs+like+a+principal+engineer.;GitHub+parity+preview.;DevSecOps+%2B+GRC+built-in." alt="Typing SVG" />
</picture>

</div>

---

## ✨ Features at a glance

| Capability            | Status | Notes                                          |
| --------------------- | :----: | ---------------------------------------------- |
| GitHub-parity preview |   ✅   | \`rehype-sanitize\` + custom schema             |
| LaTeX ($E=mc^2$)      |   ✅   | via \`remark-math\` + \`rehype-katex\`           |
| Mermaid diagrams      |   ✅   | client-side renderer                           |
| Secret scanning       |   ✅   | regex + entropy heuristics                     |
| GRC compliance        |   ✅   | License / Contributing detection               |

### Task list

- [x] Monaco editor with focus mode
- [x] Visual diff against last save
- [ ] Pair devices via QR _(scaffolded)_
- [ ] Your next great README

### A bit of math

The quadratic formula:

$$
x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}
$$

### A mermaid diagram

\`\`\`mermaid
flowchart LR
  A[Write] --> B{Validate}
  B -->|safe| C[Preview]
  B -->|risky| D[Warn]
  C --> E[Export]
\`\`\`

### Code block

\`\`\`ts
// Hooks like these keep the studio honest.
export function useSecretScanner(text: string) {
  // ...
  return findings;
}
\`\`\`

> Tip — drag an image anywhere onto the editor and it will be uploaded and
> linked automatically.

---

<div align="center">
  <sub>Built with ❤️  · Next.js 14 App Router · Zustand · Monaco</sub>
</div>
`;
