/** Collect every string leaf in a JSON-like tree (for counting / scanning). */
export function collectAllStringLeaves(v: unknown, acc: string[]): void {
  if (typeof v === "string") {
    acc.push(v);
    return;
  }
  if (Array.isArray(v)) {
    for (const x of v) collectAllStringLeaves(x, acc);
    return;
  }
  if (v !== null && typeof v === "object") {
    for (const x of Object.values(v as Record<string, unknown>)) collectAllStringLeaves(x, acc);
  }
}
