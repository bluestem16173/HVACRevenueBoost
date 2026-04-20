import { assertHsdV26AuthorityRules } from "@/lib/hsd/assertHsdV26AuthorityRules";
import { enforceStrongHeadline } from "@/lib/hsd/enforceStrongHeadline";
import { limitCanonicalTruthOccurrences } from "@/lib/hsd/limitCanonicalTruthOccurrences";
import { normalizeHsdV25PreFinalize } from "@/lib/hsd/normalizeHsdV25PreFinalize";
import { removeScaffoldingFromPayload } from "@/lib/hsd/removeScaffoldingFromPayload";
import { HSDV25Schema, type HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

export { enforceStrongHeadline } from "@/lib/hsd/enforceStrongHeadline";
export { removeScaffoldingFromPayload as removeScaffolding } from "@/lib/hsd/removeScaffoldingFromPayload";

/** Zod parse — throws on invalid shape. */
export function assertSchema(page: unknown): HsdV25Payload {
  return HSDV25Schema.parse(page);
}

/** Publish / authority invariants (scaffolding, CTA, quick_table, decision, cost ladder, etc.). */
export const assertContentRules = assertHsdV26AuthorityRules;

export { assertHsdV26AuthorityRules };

export { limitCanonicalTruthOccurrences as limitCoreTruthsInPage } from "@/lib/hsd/limitCanonicalTruthOccurrences";

/**
 * **Validate → fix → validate**: schema parse, headline cleanup, scaffolding strip,
 * canonical-truth budget, then {@link assertHsdV26AuthorityRules} (matches generate → finalize → save).
 */
export function finalizeHsdV25Page(page: unknown): HsdV25Payload {
  if (page !== null && typeof page === "object" && !Array.isArray(page)) {
    normalizeHsdV25PreFinalize(page as Record<string, unknown>);
  }
  let p = assertSchema(page);
  p.summary_30s.headline = enforceStrongHeadline(p.summary_30s.headline, p.slug);
  p = removeScaffoldingFromPayload(p);
  p = limitCanonicalTruthOccurrences(p);
  assertContentRules(p);
  return p;
}

/** @alias {@link finalizeHsdV25Page} */
export const finalizePage = finalizeHsdV25Page;
