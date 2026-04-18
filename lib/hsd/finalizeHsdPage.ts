import { assertHsdV25ContentRules } from "@/lib/hsd/assertHsdV25ContentRules";
import { enforceStrongHeadline } from "@/lib/hsd/enforceStrongHeadline";
import { limitCanonicalTruthOccurrences } from "@/lib/hsd/limitCanonicalTruthOccurrences";
import { removeScaffoldingFromPayload } from "@/lib/hsd/removeScaffoldingFromPayload";
import { HSDV25Schema, type HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

export { enforceStrongHeadline } from "@/lib/hsd/enforceStrongHeadline";
export { removeScaffoldingFromPayload as removeScaffolding } from "@/lib/hsd/removeScaffoldingFromPayload";

/** Zod parse — throws on invalid shape. */
export function assertSchema(page: unknown): HsdV25Payload {
  return HSDV25Schema.parse(page);
}

/** Publish / authority invariants (scaffolding, CTA, quick_table, etc.). */
export const assertContentRules = assertHsdV25ContentRules;

export { limitCanonicalTruthOccurrences as limitCoreTruthsInPage } from "@/lib/hsd/limitCanonicalTruthOccurrences";

/**
 * **Validate → fix → validate**: schema parse, headline cleanup, scaffolding strip,
 * canonical-truth budget, then full content rules (matches generate → finalize → save).
 */
export function finalizeHsdV25Page(page: unknown): HsdV25Payload {
  let p = assertSchema(page);
  p.summary_30s.headline = enforceStrongHeadline(p.summary_30s.headline);
  p = removeScaffoldingFromPayload(p);
  p = limitCanonicalTruthOccurrences(p);
  assertContentRules(p);
  return p;
}

/** @alias {@link finalizeHsdV25Page} */
export const finalizePage = finalizeHsdV25Page;
