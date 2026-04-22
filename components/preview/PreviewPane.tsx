"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useDebounce } from "use-debounce";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Eye, Smartphone, Monitor, Maximize2, Minimize2 } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { githubSanitizeSchema } from "@/lib/sanitizeSchema";
import { MermaidBlock } from "./MermaidBlock";
import { cn } from "@/lib/utils";

type ViewMode = "desktop" | "mobile";

/**
 * Critical Preview Pane.
 *
 * Rendering stack (outer → inner):
 *   remarkGfm          – tables, task lists, autolinks, strikethrough
 *   remarkMath         – $…$ / $$…$$ → math nodes
 *   rehypeRaw          – parse inline HTML into hast (required for <picture>)
 *   rehypeSanitize     – enforce our GitHub-parity whitelist (the "safety net")
 *   rehypeKatex        – render math nodes to KaTeX HTML
 *
 * Component overrides handle:
 *   · Code fences  → syntax highlighter or MermaidBlock
 *   · Anchor tags  → force target="_blank" + rel="noopener noreferrer"
 *   · Images       → lazy + decoding=async + max-width sanity
 *   · Headings     → id slugs so TOC anchor links work
 */
export default function PreviewPane() {
  const content = useMarkdownStore((s) => s.content);
  // Debounce the content feeding react-markdown so heavy READMEs (large
  // docs with mermaid diagrams, dozens of shield badges, LaTeX blocks)
  // don't re-parse on every keystroke. 150ms is below the perceptual
  // threshold for "live preview" while giving the remark/rehype pipeline
  // room to breathe.
  const [debouncedContent] = useDebounce(content, 150);
  const theme = useMarkdownStore((s) => s.theme);
  const previewScale = useMarkdownStore((s) => s.previewScale);
  const setPreviewScale = useMarkdownStore((s) => s.setPreviewScale);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Force the preview pane's color-scheme to track the app theme. This is what
  // makes `<picture><source media="(prefers-color-scheme: dark)" ...>` flip
  // correctly for things like contribution snakes and typing SVGs.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.colorScheme = theme;
    root.dataset.theme = theme;
  }, [theme]);

  const components: Components = useMemo(
    () => ({
      // ---- Code / Mermaid / Syntax highlight --------------------------
      // react-markdown v9 removed the `inline` prop: block code fences are
      // wrapped in <pre>, inline code is not. We detect by checking for a
      // language-* class (fences always have one in GFM) and the presence of
      // a newline in the body.
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className ?? "");
        const lang = match?.[1];
        const body = String(children).replace(/\n$/, "");
        const isBlock = Boolean(lang) || /\n/.test(body);

        if (isBlock && lang === "mermaid") {
          return <MermaidBlock code={body} />;
        }
        if (isBlock && lang) {
          return (
            <SyntaxHighlighter
              language={lang}
              // `vscDarkPlus` is exported as a loose record by
              // react-syntax-highlighter. We go via `unknown` to satisfy
              // TypeScript strict mode without needing to reach for `any`
              // or suppress any rules — the runtime value is what
              // SyntaxHighlighter expects.
              style={vscDarkPlus as unknown as { [key: string]: CSSProperties }}
              PreTag="div"
              customStyle={{
                margin: 0,
                background: "#161b22",
                borderRadius: 6,
                padding: 16,
                fontSize: 13,
              }}
              codeTagProps={{
                style: { fontFamily: "JetBrains Mono, Fira Code, monospace" },
              }}
            >
              {body}
            </SyntaxHighlighter>
          );
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // When we syntax-highlight, we already emit our own <pre>-like wrapper,
      // so react-markdown's outer <pre> would double-wrap. Unwrap it.
      pre({ children }) {
        return <>{children}</>;
      },

      // ---- Links: ALWAYS target="_blank" + noopener noreferrer ---------
      a({ href, children, ...props }) {
        const isHash = typeof href === "string" && href.startsWith("#");
        return (
          <a
            {...props}
            href={href}
            target={isHash ? undefined : "_blank"}
            rel={isHash ? undefined : "noopener noreferrer"}
          >
            {children}
          </a>
        );
      },

      // ---- Images: lazy, async decode, sensible defaults --------------
      img({ src, alt, ...props }) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            {...props}
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            decoding="async"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        );
      },

      // ---- Headings: add stable id so TOC links work -------------------
      h1: (p) => <h1 {...p} id={p.id ?? slugify(childText(p.children))} />,
      h2: (p) => <h2 {...p} id={p.id ?? slugify(childText(p.children))} />,
      h3: (p) => <h3 {...p} id={p.id ?? slugify(childText(p.children))} />,
      h4: (p) => <h4 {...p} id={p.id ?? slugify(childText(p.children))} />,
      h5: (p) => <h5 {...p} id={p.id ?? slugify(childText(p.children))} />,
      h6: (p) => <h6 {...p} id={p.id ?? slugify(childText(p.children))} />,
    }),
    [],
  );

  const viewMode: ViewMode = previewScale < 0.85 ? "mobile" : "desktop";

  return (
    <div ref={rootRef} className="frame-3d relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-neon-pink" />
          <span className="font-display text-[11px] tracking-widest text-slate-300">
            GITHUB PREVIEW
          </span>
          <span className="chip bg-neon-pink/10 text-neon-pink">PARITY</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              "btn-base px-2 py-1",
              viewMode === "desktop" ? "btn-neon-cyan" : "btn-ghost",
            )}
            onClick={() => setPreviewScale(1)}
            title="Desktop width"
          >
            <Monitor className="h-3 w-3" />
          </button>
          <button
            className={cn(
              "btn-base px-2 py-1",
              viewMode === "mobile" ? "btn-neon-cyan" : "btn-ghost",
            )}
            onClick={() => setPreviewScale(0.7)}
            title="Mobile width"
          >
            <Smartphone className="h-3 w-3" />
          </button>
          <button
            className="btn-ghost px-2 py-1"
            onClick={() =>
              setPreviewScale(
                Math.max(0.5, Math.min(1.3, previewScale + 0.1)),
              )
            }
            title="Zoom in"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            className="btn-ghost px-2 py-1"
            onClick={() =>
              setPreviewScale(
                Math.max(0.5, Math.min(1.3, previewScale - 0.1)),
              )
            }
            title="Zoom out"
          >
            <Minimize2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Scroll surface */}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-auto",
          theme === "dark" ? "bg-gh-bg" : "bg-gh-bgLight",
        )}
      >
        <div
          id="preview-root"
          className="mx-auto px-6 py-8"
          style={{
            maxWidth: viewMode === "mobile" ? 420 : 920,
            transform: `scale(${previewScale})`,
            transformOrigin: "top center",
          }}
        >
          <article
            className={cn(
              "prose prose-github",
              theme === "light" && "prose-light",
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[
                rehypeRaw,
                // The sanitizer type expects `hast-util-sanitize`'s Schema; we
                // use a structural type to avoid a direct dependency. Cast to
                // unknown first for strict-mode compatibility.
                [rehypeSanitize, githubSanitizeSchema as unknown as object],
                rehypeKatex,
              ]}
              components={components}
              skipHtml={false}
            >
              {debouncedContent}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}

// ---- utils ----------------------------------------------------------------

function childText(children: ReactNode): string {
  if (children == null) return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(childText).join("");
  }
  if (typeof children === "object" && "props" in (children as { props?: unknown })) {
    return childText((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}
