"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { Search, X, Plus, Check, Layers, Trash2, Filter } from "lucide-react";
import { useMarkdownStore } from "@/store/useMarkdownStore";
import { DrawerHeader } from "./ImporterDrawer";
import {
  TECH_STACK,
  TECH_STACK_COUNT,
  searchFlat,
  renderTechBadgeBlock,
  type TechItem,
} from "@/lib/tech-stack-generator";
import { insertAtCursor } from "@/lib/editorBridge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Height of a single badge row in pixels. Matches `h-11` + gaps. */
const ROW_HEIGHT = 48;
/** Minimum badge width — drives itemsPerRow calculation. */
const MIN_BADGE_WIDTH = 130;
/** Horizontal gap between badges (matches `gap-1.5`). */
const BADGE_GAP = 6;
/** Extra rows rendered above/below the viewport for smooth scrolling. */
const OVERSCAN = 5;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * TechStackDrawer — virtualized catalog of ~3,200 Shields.io badges.
 *
 * Architecture:
 *   [ search ] → useDebounce(300ms) → useMemo(searchFlat) → chunked rows
 *                                                              ↓
 *                                         useVirtualizer → viewport rows only
 *
 * Only ~12 rows (≈ 40–60 badges) are ever in the DOM, regardless of how many
 * entries match the query. Scrolling at 60 fps even on low-end hardware.
 */
export default function TechStackDrawer() {
  const content = useMarkdownStore((s) => s.content);
  const setContent = useMarkdownStore((s) => s.setContent);
  const setActivePanel = useMarkdownStore((s) => s.setActivePanel);

  // --- Search --------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // --- Selection basket ----------------------------------------------------
  // Map keyed by logo slug preserves insertion order (matters for inject).
  const [selected, setSelected] = useState<Map<string, TechItem>>(new Map());

  const isSelected = useCallback(
    (item: TechItem) => selected.has(item.logo),
    [selected],
  );

  const toggle = useCallback((item: TechItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.logo)) next.delete(item.logo);
      else next.set(item.logo, item);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Map());

  // --- Filtering (debounced, memoized) -------------------------------------
  const filtered = useMemo<TechItem[]>(() => {
    const base = searchFlat(debouncedQuery);
    if (!activeCategory) return base;
    return base.filter((item) => item.categoryId === activeCategory);
  }, [debouncedQuery, activeCategory]);

  // --- Responsive items-per-row --------------------------------------------
  // We measure the scroll container width and split `filtered` into rows of
  // `itemsPerRow`. A ResizeObserver keeps this in sync with drawer resizes.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const itemsPerRow = useMemo(() => {
    if (containerWidth <= 0) return 3;
    // Padding on both sides accounted for in the container width measurement.
    const available = containerWidth - 8;
    const perRow = Math.floor((available + BADGE_GAP) / (MIN_BADGE_WIDTH + BADGE_GAP));
    return Math.max(1, perRow);
  }, [containerWidth]);

  const rows = useMemo<TechItem[][]>(() => {
    const out: TechItem[][] = [];
    for (let i = 0; i < filtered.length; i += itemsPerRow) {
      out.push(filtered.slice(i, i + itemsPerRow));
    }
    return out;
  }, [filtered, itemsPerRow]);

  // --- Virtualizer ---------------------------------------------------------
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Reset scroll position when the filter changes so the user sees results
  // from the top, not mid-way down the previous list.
  useEffect(() => {
    virtualizer.scrollToIndex(0, { align: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeCategory, itemsPerRow]);

  // --- Actions -------------------------------------------------------------
  const inject = () => {
    if (selected.size === 0) return;
    const items = Array.from(selected.values());
    const block = renderTechBadgeBlock(items);

    // Prefer inserting at the Monaco cursor so users can drop badges exactly
    // where they're writing. If the editor isn't mounted (shouldn't happen in
    // the normal flow, but possible during teardown) we fall back to the
    // store-level append so the inject never silently drops the user's work.
    const ok = insertAtCursor(`\n\n${block}\n`);
    if (!ok) {
      const next = content.endsWith("\n")
        ? `${content}\n${block}\n`
        : `${content}\n\n${block}\n`;
      setContent(next);
    }
    clearSelection();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setActiveCategory(null);
    }
    if (e.key === "Enter" && filtered[0]) {
      toggle(filtered[0]);
    }
  };

  // --- Render --------------------------------------------------------------
  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className="flex h-full flex-col">
      <DrawerHeader
        title={`Tech Stack · ${TECH_STACK_COUNT.toLocaleString()}`}
        onClose={() => setActivePanel("none")}
      />

      {/* Sticky search */}
      <div className="border-b border-white/5 bg-ink-950/80 p-3 backdrop-blur space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${TECH_STACK_COUNT.toLocaleString()} technologies…`}
            className="input-base pl-9 pr-9 font-mono text-xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-slate-500 hover:bg-white/10 hover:text-white"
              title="Clear search (Esc)"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 toolbar-scroll">
          <Filter className="h-3 w-3 shrink-0 text-slate-500" />
          <CategoryChip
            label="All"
            active={activeCategory === null}
            count={TECH_STACK_COUNT}
            onClick={() => setActiveCategory(null)}
          />
          {TECH_STACK.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={`${cat.icon} ${cat.label}`}
              active={activeCategory === cat.id}
              count={cat.items.length}
              onClick={() =>
                setActiveCategory((cur) => (cur === cat.id ? null : cat.id))
              }
            />
          ))}
        </div>

        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-slate-500">
          <span>
            {filtered.length.toLocaleString()} result
            {filtered.length === 1 ? "" : "s"}
            {debouncedQuery && ` for “${debouncedQuery}”`}
          </span>
          {selected.size > 0 && (
            <span className="text-neon-cyan">
              {selected.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Virtualized grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-2"
        // A fixed, explicit sizing context lets the virtualizer measure correctly.
        style={{ contain: "strict" }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            query={debouncedQuery}
            onClear={() => {
              setQuery("");
              setActiveCategory(null);
            }}
          />
        ) : (
          <div
            style={{
              height: `${totalSize}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualRows.map((vRow) => {
              const row = rows[vRow.index];
              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  className="absolute left-0 right-0 flex items-center gap-1.5 px-1"
                  style={{
                    top: 0,
                    transform: `translateY(${vRow.start}px)`,
                    height: `${ROW_HEIGHT}px`,
                  }}
                >
                  {row.map((item) => (
                    <BadgeChip
                      key={item.logo}
                      item={item}
                      active={isSelected(item)}
                      onToggle={() => toggle(item)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating inject footer — only when basket has items */}
      {selected.size > 0 && <InjectFooter
        items={Array.from(selected.values())}
        onInject={inject}
        onClear={clearSelection}
        onRemove={(slug) =>
          setSelected((prev) => {
            const next = new Map(prev);
            next.delete(slug);
            return next;
          })
        }
      />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function CategoryChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "chip shrink-0 transition-colors cursor-pointer",
        active
          ? "bg-neon-cyan/20 text-neon-cyan ring-1 ring-neon-cyan/50"
          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200",
      )}
      title={`${label} — ${count} items`}
    >
      <span>{label}</span>
      <span className="opacity-60">{count}</span>
    </button>
  );
}

/**
 * A single badge chip. The chip is the *authoritative* visual — we don't
 * overlay the shields.io image because:
 *   · it looked broken when 3,000 chips each tried to fetch their own image
 *   · the swatch-colored hex is already the brand color, so the image was
 *     just a fancy duplicate
 *   · without the network request, scrolling stays smooth even at 60fps and
 *     users on slow connections don't hit shields.io rate limits
 * The injected Markdown still uses the real image — this simplification only
 * affects the picker UI.
 */
function BadgeChip({
  item,
  active,
  onToggle,
}: {
  item: TechItem;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={`${item.name} — logo:${item.logo}`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md px-2.5 h-9 min-w-0 flex-1",
        "transition-all font-mono tracking-wide text-[11px]",
        "ring-1 cursor-pointer",
        active
          ? "bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] text-[color:var(--accent-cyan)] ring-[color-mix(in_srgb,var(--accent-cyan)_60%,transparent)]"
          : "bg-[color:var(--surface)] text-[color:var(--text)] ring-[color:var(--border)] hover:bg-[color:var(--surface-hi)] hover:ring-[color:var(--border-hi)]",
      )}
      style={
        active
          ? {
              boxShadow: `0 0 16px color-mix(in srgb, #${item.hex} 35%, transparent)`,
            }
          : undefined
      }
    >
      {/* Colored swatch — the chip's visual anchor. Uses the brand hex. */}
      <span
        className="inline-block h-4 w-4 shrink-0 rounded-sm"
        style={{
          background: `#${item.hex}`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, #${item.hex} 60%, black 40%)`,
        }}
        aria-hidden
      />

      {/* Label */}
      <span className="flex-1 truncate uppercase text-left">{item.name}</span>

      {/* Selection indicator */}
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded transition-opacity",
          active ? "opacity-100" : "opacity-40 group-hover:opacity-90",
        )}
      >
        {active ? (
          <Check className="h-3 w-3" />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}

function EmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="m-3 rounded-lg border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-slate-500">
      <Search className="mx-auto mb-2 h-5 w-5 opacity-40" />
      {query ? (
        <>
          No technologies match{" "}
          <span className="text-slate-300">&quot;{query}&quot;</span>
        </>
      ) : (
        <>No technologies in the current category filter.</>
      )}
      <br />
      <button onClick={onClear} className="mt-3 btn-ghost mx-auto">
        Clear filters
      </button>
    </div>
  );
}

/**
 * Floating action bar that appears when the basket is non-empty. Shows the
 * selected slugs as dismissable pills and a prominent "Inject Stack" button.
 */
function InjectFooter({
  items,
  onInject,
  onClear,
  onRemove,
}: {
  items: TechItem[];
  onInject: () => void;
  onClear: () => void;
  onRemove: (slug: string) => void;
}) {
  return (
    <div className="border-t border-white/5 bg-ink-950/90 p-3 space-y-2 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Basket · {items.length}
        </span>
        <button
          onClick={onClear}
          className="btn-base h-6 px-2 text-[10px] text-slate-400 hover:text-neon-pink"
        >
          <Trash2 className="h-3 w-3" /> Clear
        </button>
      </div>
      <div className="flex max-h-24 flex-wrap gap-1 overflow-auto">
        {items.map((s) => (
          <span
            key={s.logo}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]"
            style={{
              background: `#${s.hex}22`,
              color: `#${s.hex}`,
              boxShadow: `inset 0 0 0 1px #${s.hex}44`,
            }}
          >
            {s.name}
            <button
              onClick={() => onRemove(s.logo)}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remove ${s.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <button className="btn-neon-cyan w-full justify-center" onClick={onInject}>
        <Layers className="h-3.5 w-3.5" />
        Inject Stack · {items.length} badge{items.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}
