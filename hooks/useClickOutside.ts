"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Close `handler` when a pointerdown fires outside of every provided ref.
 *
 * Why pointerdown instead of click:
 *   pointerdown fires before mouseup / click, so the drawer is already gone
 *   by the time any click handlers on the outside element would run. This
 *   eliminates the "had to click twice" feel.
 *
 * Why mirror refs:
 *   Callers typically pass fresh array literals and inline arrow functions
 *   every render. A naïve `useEffect(..., [refs, handler, enabled])` would
 *   therefore tear down and re-install the document listener on every single
 *   parent render — including every keystroke while a drawer is open. That
 *   wasted ~30 addEventListener / removeEventListener pairs per second.
 *
 *   Instead: we stash the latest `refs` and `handler` in mirror refs that
 *   update synchronously on each render. The document listener itself is
 *   installed only when `enabled` flips, and reads through the mirror refs
 *   so it always sees the freshest values.
 *
 * Usage:
 *   const drawerRef = useRef<HTMLDivElement>(null);
 *   const toolbarRef = useRef<HTMLDivElement>(null);
 *   useClickOutside([drawerRef, toolbarRef], () => close(), open);
 *
 * Multiple refs are useful when the "inside" region spans siblings —
 * e.g. the drawer and the toolbar button that opened it. Without both,
 * clicking the toggle button would dismiss the drawer and immediately
 * re-open it on the next event cycle.
 */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  handler: () => void,
  enabled: boolean = true,
): void {
  // Mirror refs — updated every render so the listener always sees the
  // current values without needing to re-attach.
  const refsRef = useRef(refs);
  const handlerRef = useRef(handler);
  refsRef.current = refs;
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      // If the click landed inside ANY of the current refs, ignore it.
      for (const ref of refsRef.current) {
        const el = ref.current;
        if (el && el.contains(target)) return;
      }
      handlerRef.current();
    };

    // `capture: true` — run before any in-tree stopPropagation().
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [enabled]);
}
