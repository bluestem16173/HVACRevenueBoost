/**
 * DG Authority v3 — structured diagnostic JSON + build pipeline.
 * @module
 */

export { buildDgAuthorityV3Page } from "./buildDgAuthorityV3Page";
export type {
  DgAuthorityV3FailureClusterDual,
  DgAuthorityV3PageInput,
  DgAuthorityV3RiskNote,
} from "./typesDgAuthorityV3";
export type { DgLeadCtaContext } from "./resolveCTA";
export { issuePhraseFromPageTitle, resolveContextualCTA } from "./resolveCTA";
export {
  assertDgAuthorityV3StructuredPayload,
  isStructuredDgAuthorityV3Payload,
} from "./validateDgAuthorityV3Structured";
