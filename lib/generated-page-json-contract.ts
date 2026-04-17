/**
 * Markers on every generated page `content_json` envelope (and `pages.schema_version`
 * where the publisher writes the same contract).
 */
export const GENERATED_PAGE_LAYOUT = "dg_authority_v2" as const;
export const GENERATED_PAGE_SCHEMA_VERSION = "dg_authority_v2" as const;

/** Structured diagnostic pages with dual-layer pro/home/risk + dual CTA (see `RenderDgAuthorityV3`). */
export const DG_AUTHORITY_V3_LAYOUT = "dg_authority_v3" as const;
export const DG_AUTHORITY_V3_SCHEMA_VERSION = "dg_authority_v3" as const;
