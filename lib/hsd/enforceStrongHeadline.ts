import {
  LOCKED_AC_NOT_COOLING_HEADLINE,
  isAcNotCoolingCitySlug,
} from "@/lib/hsd/lockedAcNotCoolingHeadline";

/**
 * Strip article-style scaffolding from the 30s headline (technician gate, not blog intro).
 * For `hvac/ac-not-cooling/*` slugs the headline is locked to one exact string.
 */
export function enforceStrongHeadline(headline: string, slug?: string): string {
  if (slug && isAcNotCoolingCitySlug(slug)) {
    return LOCKED_AC_NOT_COOLING_HEADLINE;
  }
  let h = String(headline ?? "").trim();
  h = h.replace(/\b30[-\s]?second\s+read\b/gi, "").replace(/\s{2,}/g, " ").trim();
  h = h.replace(
    /\b(understanding|guide|learn\s+about|in\s+this\s+article|in\s+this\s+guide|we\s+will\s+explore|we'll\s+explore)\b/gi,
    ""
  );
  h = h.replace(/\s{2,}/g, " ").replace(/^\s*[.,;:—-]+\s*|\s*[.,;:—-]+\s*$/g, "").trim();
  if (!h) {
    throw new Error("summary_30s.headline is empty after cleanup — supply a direct diagnosis gate line");
  }
  if (h.length < 50) {
    throw new Error(
      "summary_30s.headline is under 50 characters after cleanup — rewrite as a direct diagnosis gate with city/symptom load"
    );
  }
  return h;
}
