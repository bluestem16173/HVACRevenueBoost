import {
  GENERATED_PAGE_LAYOUT,
  GENERATED_PAGE_SCHEMA_VERSION,
} from "@/lib/generated-page-json-contract";

/** Stored on `pages.schema_version` for {@link HSD_Page_Build} output. */
export const HSD_V1_LOCKED_SCHEMA_VERSION = GENERATED_PAGE_SCHEMA_VERSION;

/** Marker inside `pages.content_json` for renderer routing. */
export const HSD_V1_LOCKED_LAYOUT = GENERATED_PAGE_LAYOUT;

/** Flat string body keys (AI JSON + `renderHSDPage` text). Mermaid is never stored — see `diagnostic_flow`. */
export const HSD_LOCKED_BODY_KEYS = [
  "hero",
  "problem_overview",
  "decision_tree",
  "how_system_works",
  "top_causes",
  "cost_matrix",
  "repair_vs_replace",
  "electrical_warning",
  "field_insight",
  "maintenance",
  "decision_moment",
  "cost_pressure",
  "cta",
  "stop_diy",
] as const;

export type HsdLockedBodyKey = (typeof HSD_LOCKED_BODY_KEYS)[number];
