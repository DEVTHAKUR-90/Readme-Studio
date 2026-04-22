/**
 * Line-based diff with performance safeguards.
 *
 * The original implementation ran a full O(n·m) LCS matrix on every call,
 * which meant editing a 1,000-line README with the Changes drawer open
 * allocated a 1,000,000-cell matrix on every keystroke. This version:
 *
 *   1. Strips matching prefix + suffix lines before the LCS (a typical edit
 *      changes a tiny slice of the document, so this shrinks the problem by
 *      orders of magnitude).
 *   2. Falls back to a cheap O(n+m) same-line-equality diff when the
 *      remaining middle is too large to LCS safely.
 *
 * Output format is unchanged: a flat list of add/remove/equal ops suitable
 * for direct rendering.
 */

export type DiffOp =
  | { type: "equal"; value: string }
  | { type: "add"; value: string }
  | { type: "remove"; value: string };

/**
 * Above this middle size, we skip the LCS and produce a naive diff. The
 * threshold is in "cells" (len(a) × len(b)) — ~250k cells ≈ 500 × 500 lines
 * on each side, which is well under a millisecond to compute.
 */
const LCS_CELL_BUDGET = 250_000;

/**
 * LCS matrix for two string arrays. Kept in a separate function so the fast
 * path can bail out before allocating it.
 */
function lcsMatrix(a: string[], b: string[]): Int32Array[] {
  const m = a.length;
  const n = b.length;
  // Int32Array is ~2x faster than regular arrays for numeric DP and uses
  // contiguous memory (better cache behavior).
  const dp: Int32Array[] = new Array(m + 1);
  for (let i = 0; i <= m; i++) dp[i] = new Int32Array(n + 1);

  for (let i = m - 1; i >= 0; i--) {
    const ai = a[i];
    const row = dp[i];
    const next = dp[i + 1];
    for (let j = n - 1; j >= 0; j--) {
      row[j] =
        ai === b[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
    }
  }
  return dp;
}

/**
 * Naive fallback diff: emits `equal` for matching lines in the same index,
 * and remove/add for the rest. Not a "real" diff but catches the common
 * append/prepend case and avoids freezing the UI on pathological inputs.
 */
function naiveDiff(a: string[], b: string[]): DiffOp[] {
  const ops: DiffOp[] = [];
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) {
    if (a[i] === b[i]) ops.push({ type: "equal", value: a[i] });
    else {
      ops.push({ type: "remove", value: a[i] });
      ops.push({ type: "add", value: b[i] });
    }
  }
  for (let i = min; i < a.length; i++) ops.push({ type: "remove", value: a[i] });
  for (let i = min; i < b.length; i++) ops.push({ type: "add", value: b[i] });
  return ops;
}

/**
 * Real LCS-driven diff for the trimmed middle section.
 */
function lcsDiff(a: string[], b: string[]): DiffOp[] {
  const dp = lcsMatrix(a, b);
  const ops: DiffOp[] = [];

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", value: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "remove", value: a[i] });
      i++;
    } else {
      ops.push({ type: "add", value: b[j] });
      j++;
    }
  }
  while (i < a.length) ops.push({ type: "remove", value: a[i++] });
  while (j < b.length) ops.push({ type: "add", value: b[j++] });
  return ops;
}

/**
 * Produce a line-by-line diff between `oldText` and `newText`. The common
 * prefix and suffix are trimmed before running LCS so the usual "edited one
 * line in the middle of a long document" case is effectively free.
 */
export function diffLines(oldText: string, newText: string): DiffOp[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");

  // --- Fast path: identical inputs -----------------------------------------
  if (oldText === newText) {
    return a.map((value) => ({ type: "equal" as const, value }));
  }

  // --- Trim matching prefix ------------------------------------------------
  let prefix = 0;
  const maxPrefix = Math.min(a.length, b.length);
  while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix++;

  // --- Trim matching suffix ------------------------------------------------
  let suffix = 0;
  const maxSuffix = Math.min(a.length - prefix, b.length - prefix);
  while (
    suffix < maxSuffix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix++;
  }

  // --- Middle slice -------------------------------------------------------
  const midA = a.slice(prefix, a.length - suffix);
  const midB = b.slice(prefix, b.length - suffix);

  // --- Dispatch to real LCS or naive fallback -----------------------------
  let middleOps: DiffOp[];
  if (midA.length * midB.length > LCS_CELL_BUDGET) {
    middleOps = naiveDiff(midA, midB);
  } else {
    middleOps = lcsDiff(midA, midB);
  }

  // --- Reassemble ---------------------------------------------------------
  const ops: DiffOp[] = [];
  for (let i = 0; i < prefix; i++) {
    ops.push({ type: "equal", value: a[i] });
  }
  ops.push(...middleOps);
  for (let i = 0; i < suffix; i++) {
    ops.push({ type: "equal", value: a[a.length - suffix + i] });
  }
  return ops;
}
