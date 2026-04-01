/**
 * Prompt references — docs + engine constants.
 */
export { EXPECTED_PROMPT_HASH, ENGINE_VERSION, MASTER_GOLD_STANDARD_PROMPT } from "@/lib/content-engine/core";

export const PROMPT_DOCS = [
  "docs/MASTER-PROMPT-DECISIONGRID.md",
  "docs/DIAGNOSTIC-PAGE-GENERATOR-SCHEMA.md",
  "docs/DIAGNOSE_PAGE_BUILD_REFERENCE.md",
] as const;
