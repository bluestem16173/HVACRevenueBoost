export function normalizeToString(input: any): string {
  if (!input) return "";

  if (typeof input === "string") return input;

  if (typeof input === "object") {
    return input.name || input.label || input.title || "";
  }

  return String(input);
}

/**
 * Check if AI output is likely truncated (missing closing brace).
 */
export function isJsonTruncated(raw: string): boolean {
  const trimmed = (raw || "").trim();
  if (!trimmed) return true;
  return !trimmed.endsWith("}");
}

/**
 * Safe JSON parse with recovery for truncated AI output.
 * Attempts recovery when parse fails (e.g. "Unterminated string in JSON").
 */
export function safeJsonParse<T = unknown>(input: string): T | null {
  if (!input || typeof input !== "string") return null;

  try {
    return JSON.parse(input) as T;
  } catch (err) {
    console.warn("⚠️ JSON parse failed, attempting recovery...", (err as Error).message);

    let fixed = input.trim();

    // Remove trailing incomplete characters (comma, partial key)
    fixed = fixed.replace(/,\s*$/, "");

    // Strategy 1: Truncate at last complete closing brace, then balance (common for truncated output)
    const lastBrace = fixed.lastIndexOf("}");
    if (lastBrace >= 0) {
      const truncated = fixed.slice(0, lastBrace + 1);
      const openInTruncated = (truncated.match(/{/g) || []).length;
      const closeInTruncated = (truncated.match(/}/g) || []).length;
      const balanced = truncated + "}".repeat(Math.max(0, openInTruncated - closeInTruncated));
      try {
        return JSON.parse(balanced) as T;
      } catch {
        // try parse without extra braces (truncation might have cut mid-object)
        try {
          return JSON.parse(truncated) as T;
        } catch {
          // continue to next strategy
        }
      }
    }

    // Strategy 2: Close unterminated string + balance braces/brackets
    const isUnterminatedString = (err as Error).message?.includes("Unterminated string");
    if (isUnterminatedString) {
      fixed += '"';
    }

    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    fixed += "}".repeat(Math.max(0, openBraces - closeBraces));
    fixed += "]".repeat(Math.max(0, openBrackets - closeBrackets));

    try {
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

/** Collapse duplicate lines (trimmed); first occurrence wins; blank lines dropped. */
export function dedupeLines(text: string): string {
  const seen = new Set<string>();
  return text
    .split("\n")
    .filter((line) => {
      const key = line.trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

/** SEO titles: "typical cost bands" → "typical cost" (drops redundant "bands" after "cost"). */
export function stripCostBandsFromTitle(title: string): string {
  return String(title ?? "")
    .replace(/\bcost\s+bands\b/gi, "cost")
    .trim();
}
