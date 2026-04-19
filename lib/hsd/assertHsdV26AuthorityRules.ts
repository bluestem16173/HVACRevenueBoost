import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { assertHsdV25ContentRules } from "@/lib/hsd/assertHsdV25ContentRules";

/**
 * **HSD v2.6 authority freeze** — full content rules plus explicit structural invariants
 * the renderer depends on (Quick Diagnosis table, decision columns, cost ladder).
 *
 * Call this (or {@link finalizeHsdV25Page}, which invokes it) before any persist of `hsd_v2` city_symptom JSON.
 */
export function assertHsdV26AuthorityRules(page: HsdV25Payload): void {
  assertHsdV25ContentRules(page);

  const ct = (page.canonical_truths ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (ct.length < 1 || ct.length > 2) {
    throw new Error("HSD authority: canonical_truths must have 1–2 non-empty lines (max 2 core truths)");
  }

  if ((page.quick_table ?? []).length < 4) {
    throw new Error("HSD authority: quick_table must have at least 4 rows (Quick Diagnosis scan table)");
  }

  const esc = page.cost_escalation ?? [];
  if (esc.length < 4) {
    throw new Error("HSD authority: cost_escalation must have at least 4 stages");
  }

  const d = page.decision;
  if (!d || d.safe.length < 2 || d.call_pro.length < 2 || d.stop_now.length < 2) {
    throw new Error("HSD authority: decision.safe, decision.call_pro, and decision.stop_now each need ≥2 lines");
  }
}
