/**
 * Layer 8 — Smart content strategy (cost control)
 *
 * Do NOT call the LLM for every URL. Prefer:
 * - One AI pass for a canonical symptom (e.g. "AC not cooling")
 * - Code expands to city/local variants (Miami, Tampa, …) from templates + merge fields
 *
 * Use AI for: system hubs, symptom/diagnose pages, core diagnostics.
 * Avoid AI for: city/repair combo pages, thin variations, simple modifiers — use deterministic expansion.
 *
 * Toggle: LAYER8_SKIP_AI_FOR_LOCATION=false forces AI for all types (debug).
 */

/** When true (default), repair/city-style queue jobs skip the LLM (worker completes with last_error marker). */
export function shouldUseAiForQueueJob(pageType: string, proposedSlug: string): boolean {
  if (process.env.LAYER8_SKIP_AI_FOR_LOCATION === "false") {
    return true;
  }
  const slug = (proposedSlug || "").toLowerCase();
  if (slug.startsWith("repair/")) {
    return false;
  }
  const pt = (pageType || "").toLowerCase();
  if (pt === "repair" || pt === "city") {
    return false;
  }
  return true;
}
