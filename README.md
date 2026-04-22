<div align="center">

```
                            ____  _____    _    ____  __  __ _____
                           |  _ \| ____|  / \  |  _ \|  \/  | ____|
                           | |_) |  _|   / _ \ | | | | |\/| |  _|
                           |  _ <| |___ / ___ \| |_| | |  | | |___
                           |_| \_\_____/_/   \_\____/|_|  |_|_____|
                                     ___ _____ _   _ ____ ___ ___
                                    / __|_   _| | | |  _ \_ _/ _ \
                                    \__ \ | | | |_| | | | | | | | |
                                    |___/ |_|  \___/|____/___\___/
```

### The README tool I actually wanted to exist.

A hyper-versatile, 100% client-side README & Markdown studio for developers.
GitHub-parity preview, 3,300+ searchable tech badges, DevSecOps scanning,
a command palette, and an export that makes your README look good on Twitter.

<br />

![Next.js](https://img.shields.io/badge/Next.js-14-0a0c12?style=for-the-badge&logo=nextdotjs&logoColor=22E4FF)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-0a0c12?style=for-the-badge&logo=typescript&logoColor=22E4FF)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-0a0c12?style=for-the-badge&logo=tailwindcss&logoColor=FF2D94)
![Monaco](https://img.shields.io/badge/Monaco_Editor-0a0c12?style=for-the-badge&logo=visualstudiocode&logoColor=22E4FF)
![PWA](https://img.shields.io/badge/PWA-ready-0a0c12?style=for-the-badge&logo=pwa&logoColor=FF2D94)
![License: MIT](https://img.shields.io/badge/License-MIT-0a0c12?style=for-the-badge)

<br />

**[Live demo](https://readme-studio-kappa.vercel.app/) · [Getting started](#-getting-started) · [Deploy to Vercel](#-deploy-to-vercel) · [Contributing](#-contributing)**

</div>

---

## Why this exists

I kept doing the same three things whenever I wrote a README:

1. Writing markup, copying it to a sandbox, squinting to check whether GitHub would _actually_ render the `<picture>` / `<source>` / `srcset` combo I just wrote.
2. Hunting across four tabs to find a shield badge for _that one obscure language_.
3. Discovering — after pushing — that I'd left an `sk-...` key in a code block.

So I built one tool that does all three, and I built it the way I wanted it to feel: fast, dark (or light — it's your call), opinionated, with a preview pane that matches GitHub byte-for-byte.

Everything runs in the browser. There's no backend. There's no "sign up to save your work." Your README lives in `localStorage` and nowhere else.

---

## ✨ Features

### 📝 The editor

- **Monaco Editor** (the thing VS Code is built on) with a custom neon theme
- **Focus mode** — fades every line except the one you're editing, ±2 neighbors
- **Typewriter mode** — keeps your cursor vertically centered like Ulysses / iA Writer
- **Drag & drop** images anywhere; they're auto-uploaded and markdown-linked for you
- **Visual diff** against the last snapshot, GitHub red/green style
- `⌘S` / `Ctrl+S` snapshots to a rolling 20-entry history you can restore from

### 👁 The preview

Not "close enough to GitHub" — _actually_ GitHub. I took apart `rehype-sanitize`'s default schema and extended it to allow every element and attribute GitHub does, no more, no less.

- `<picture>` / `<source media>` / `srcset` → profile-snake SVGs flip correctly on dark/light
- Inline `<svg>`, `<details>`, `<kbd>`, `<mark>`, `<sup>`, `<sub>`, table alignment, all of it
- **LaTeX** via `remark-math` + KaTeX
- **Mermaid** diagrams, lazy-rendered client-side
- Auto-slugged heading ids so your table of contents links actually work
- Every external `<a>` gets `target="_blank" rel="noopener noreferrer"` — no more router hijacking
- `prefers-color-scheme` is forced to track the app theme so your badges flip correctly

### 🔐 DevSecOps built in

A regex + Shannon-entropy scanner runs on every keystroke (debounced 600 ms). Detects:

```
AWS keys    ·  GitHub PATs (classic + fine-grained + OAuth)  ·  Slack tokens
Stripe      ·  Google & OpenAI keys       ·  Anthropic keys    ·  JWT
SSH/PGP/RSA private key blocks            ·  Hardcoded passwords
```

Plus a **GRC compliance pass** that flags missing LICENSE / CONTRIBUTING / CODE_OF_CONDUCT / SECURITY sections. Everything runs in the browser. Nothing leaves your machine.

### 🧩 Tech Stack drawer — 3,300+ badges

The drawer reads straight from `simple-icons` + a curated supplement of 75+ popular languages. (Because `simple-icons` ships `openjdk` but not "Java" — this catches every gap like that.)

- **Sticky search** with rank-aware ordering — typing `java` surfaces **Java** first, not JavaScript
- **Virtualized grid** (`@tanstack/react-virtual`) — scrolls 3,300 items at 60 fps
- **Multi-select basket** — pick badges, inject them at your cursor as one clean `<p align="center">` block
- Auto-categorized into Languages, Frameworks, Databases, Data & ML, Cloud, DevOps, Cybersecurity, Dev Tools, Design, Testing, …

### 🎨 Widget Builder

One click to drop GitHub stats / streak / WakaTime / top languages / activity graphs / trophies into your README, with custom hex colors, 8 theme presets, and a live preview that degrades gracefully when the username doesn't exist.

### 🤖 AI Polish (Web Worker)

A Web Worker runs rule-based polish passes without blocking the main thread: smart quotes, em-dash normalization, heading spacing, trailing whitespace, bullet unification, blank-line collapsing. It **masks HTML blocks, code fences, and URLs** before rewriting anything — your profile `<picture>` markup stays intact. Shows you a tally of exactly what it changed.

### ⌘K Command Palette

Press `⌘K` anywhere. Every action in the app is fuzzy-searchable — save, toggle focus, run polish, open any drawer, switch theme. Arrow-key navigation, grouped sections, shortcut hints. It's the fastest path to every feature.

### 🖼 3D Export

`html2canvas` captures the preview at 2× retina, wraps it in a neon-bordered browser mockup, and downloads a PNG ready for Twitter / LinkedIn / a portfolio page.

### 💾 Everything else

- Persisted Zustand store with schema versioning + migrations
- Error boundary — a render crash shows "Reload / Hard reset" instead of a white screen
- **Auto-dismiss drawers** — click anywhere outside and they close
- **Full light & dark mode** with an inline script that prevents flash-of-wrong-theme
- PWA manifest, installable as a standalone app
- **Smooth scrolling** with `prefers-reduced-motion` respected

---

## 🚀 Getting started

```bash
git clone https://github.com/<DEVTHAKUR-90>/readme-studio
cd readme-studio
npm install
npm run dev
```

Open **http://localhost:3000** and you're writing.

### Build for production

```bash
npm run build
npm start
```

---

## ☁️ Deploy to Vercel

This app is 100% static-friendly — there's no server-side logic, no database, no API keys to configure. One-click deploy:

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repo
3. Vercel auto-detects Next.js. Accept the defaults. Click **Deploy**.

It'll be live at `<your-repo>.vercel.app` in about 90 seconds.

<details>
<summary><b>Prefer Netlify / Cloudflare Pages / self-host?</b></summary>

**Netlify**: same story — import from Git, it auto-detects Next.js.

**Cloudflare Pages**: works via `@cloudflare/next-on-pages`. See their Next.js docs.

**Self-host**: `npm run build && npm start` — it's just a Next.js app. Put it behind Nginx/Caddy and you're set.

</details>

---

## ⌨️ Keyboard shortcuts

| Shortcut          | Action                     |
| ----------------- | -------------------------- |
| `⌘K` / `Ctrl+K`   | Command palette            |
| `⌘S` / `Ctrl+S`   | Snapshot save              |
| `⌘/` / `Ctrl+/`   | Open security scanner      |
| `Esc`             | Close any drawer / palette |
| _Click outside_   | Auto-dismiss drawer        |

---

## 🗂 Project structure

```
readme-studio/
├── app/
│   ├── layout.tsx          ← root layout + flash-proof theme init
│   ├── page.tsx            ← client-only entry, error boundary here
│   └── globals.css         ← CSS-variable theme tokens
├── components/
│   ├── Workspace.tsx       ← top-level shell, splitter, drawer router
│   ├── ErrorBoundary.tsx
│   ├── editor/EditorPane.tsx
│   ├── preview/
│   │   ├── PreviewPane.tsx
│   │   └── MermaidBlock.tsx
│   ├── panels/             ← 7 drawers (Import, Security, Widgets, TechStack,
│   │                          Changes, History, Export)
│   └── ui/
│       ├── Toolbar.tsx
│       └── CommandPalette.tsx
├── hooks/                  ← useClickOutside, useSecurityScanner, useMlFormatter
├── lib/                    ← diff, editor-bridge, github-importer, sanitize-schema,
│                              security-scanner, tech-stack-generator, toc, widgets
├── store/useMarkdownStore.ts   ← Zustand + localStorage persist
└── workers/ml-formatter.worker.ts
```

---

## 🧰 Tech stack

|                  |                                               |
| ---------------- | --------------------------------------------- |
| Framework        | Next.js 14 (App Router)                       |
| Language         | TypeScript (strict)                           |
| Styling          | Tailwind CSS · `@tailwindcss/typography`      |
| Motion           | Framer Motion                                 |
| Editor           | `@monaco-editor/react`                        |
| State            | Zustand + `persist` (localStorage)            |
| Markdown         | react-markdown · remark-gfm · remark-math     |
|                  | rehype-raw · rehype-sanitize · rehype-katex   |
| Highlighting     | react-syntax-highlighter (Prism)              |
| Diagrams         | mermaid (lazy-loaded)                         |
| Badges           | simple-icons + curated language supplement    |
| Virtualization   | `@tanstack/react-virtual`                     |
| Search           | `use-debounce` + ranked substring matching    |
| Icons            | lucide-react                                  |
| Export           | html2canvas                                   |

---

## 🤝 Contributing

This started as a personal project but PRs are welcome.

**Design constraints** the codebase holds to:

- **Client-side only.** No backend, no telemetry. If you need to call an API, consider whether the feature belongs in a different tool.
- **Lean dependencies.** New heavy deps (>100 KB) need a `dynamic(...)` wrapper so they don't bloat the initial bundle.
- **Reachable from the command palette.** If a feature isn't in `CommandPalette.tsx`, power users will never find it.
- **TypeScript strict, ESLint clean.** Run `npm run type-check && npm run lint` before opening a PR.

**Quick workflow:**

```bash
git checkout -b my-feature
npm run dev         # iterate
npm run type-check
npm run lint
git commit -m "feat: ..."
git push origin my-feature
# open PR
```

---

## 📜 License

MIT — use it, fork it, ship it. Attribution appreciated but not required.

<div align="center">

<br />

```
                    ┌──────────────────────────────────────┐
                    │   crafted with care, caffeine, and   │
                    │       a lot of hard-refreshing       │
                    └──────────────────────────────────────┘
```

<br />

**If this tool saved you time, a ⭐ on the repo means the world.**

</div>
