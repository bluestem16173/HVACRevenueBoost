import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countPhraseInCanonicalTruths(page: HsdV25Payload, phrase: string): number {
  let n = 0;
  for (const t of page.canonical_truths ?? []) {
    const s = String(t);
    let p = 0;
    while ((p = s.indexOf(phrase, p)) !== -1) {
      n++;
      p += phrase.length;
    }
  }
  return n;
}

/** Apply fn to every string leaf except inside top-level `canonical_truths` (preserved verbatim). */
function mapDeepStringsSkipCanonical(value: unknown, fn: (s: string) => string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((x) => mapDeepStringsSkipCanonical(x, fn));
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o)) {
      if (k === "canonical_truths") {
        out[k] = o[k];
        continue;
      }
      out[k] = mapDeepStringsSkipCanonical(o[k], fn);
    }
    return out;
  }
  return value;
}

/**
 * Keeps **at most two** occurrences of each `canonical_truths` phrase (length ≥ 12) **site-wide**:
 * counts inside `canonical_truths` first, then allows the remainder (if any) in other fields.
 */
export function limitCanonicalTruthOccurrences(page: HsdV25Payload): HsdV25Payload {
  const phrases = (page.canonical_truths ?? [])
    .map((t) => String(t).trim())
    .filter((t) => t.length >= 12);
  if (!phrases.length) return page;

  let current: unknown = structuredClone(page);
  for (const phrase of phrases) {
    let used = countPhraseInCanonicalTruths(current as HsdV25Payload, phrase);
    const re = new RegExp(escapeRegExp(phrase), "g");
    current = mapDeepStringsSkipCanonical(current, (s: string) =>
      s.replace(re, (m) => {
        used++;
        return used <= 2 ? m : "";
      })
    );
  }
  return current as HsdV25Payload;
}
