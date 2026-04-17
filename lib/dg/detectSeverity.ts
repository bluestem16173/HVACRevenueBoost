import type { Severity } from "@/lib/dg/resolveCTA";

/**
 * Heuristic severity from free-form page JSON (stringified).
 * Order: **high** keywords first, then **medium**; otherwise **low**.
 */
export function detectSeverity(page: unknown): Severity {
  let text: string;
  try {
    const raw = JSON.stringify(page ?? null);
    text = (typeof raw === "string" ? raw : "").toLowerCase();
  } catch {
    return "low";
  }

  if (
    text.includes("burning") ||
    text.includes("shock") ||
    text.includes("gas") ||
    text.includes("breaker trips instantly") ||
    text.includes("water leak") ||
    text.includes("no hot water")
  ) {
    return "high";
  }

  if (
    text.includes("weak") ||
    text.includes("intermittent") ||
    text.includes("long runtime") ||
    text.includes("low pressure")
  ) {
    return "medium";
  }

  return "low";
}
