import {
  GENERATED_PAGE_LAYOUT,
  GENERATED_PAGE_SCHEMA_VERSION,
} from "@/lib/generated-page-json-contract";

/** Stored on `pages.schema_version` for {@link HSD_Page_Build} output. */
export const HSD_V1_LOCKED_SCHEMA_VERSION = GENERATED_PAGE_SCHEMA_VERSION;

/** Marker inside `pages.content_json` for renderer routing. */
export const HSD_V1_LOCKED_LAYOUT = GENERATED_PAGE_LAYOUT;

/** Flat string body keys (AI JSON + `renderHSDPage` text). Mermaid is never stored — see `diagnostic_flow`. */
/** Flat string body keys for HSD_Page_Build LLM output (server adds `diagnostic_flow`). */
export const HSD_LOCKED_BODY_KEYS = [
  "summary_30s",
  "decision_tree",
  "top_causes",
  "how_system_works",
  "diagnostic_steps",
  "cost_matrix",
  "replace_vs_repair",
  "stop_diy",
  "prevention_tips",
  "tools_needed",
  "bench_test_notes",
] as const;

export type HsdLockedBodyKey = (typeof HSD_LOCKED_BODY_KEYS)[number];
