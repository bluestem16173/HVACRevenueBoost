import { DG_AUTHORITY_V3_SCHEMA_VERSION } from "@/lib/prompt-schema-router";

/** Hard-set layout + schema before DB write or HTML render. */
export function enforceDgAuthorityV3Layout(
  content: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...content,
    layout: "dg_authority_v3",
    schemaVersion: DG_AUTHORITY_V3_SCHEMA_VERSION,
  };
}

/**
 * Minimum bar so junk pages are never published.
 * Throws `Invalid DG page: {slug} — …` on failure.
 */
export function assertDgAuthorityV3Publishable(
  slug: string,
  content: Record<string, unknown>
): void {
  const summary = content.summary_30s;
  if (!summary || typeof summary !== "object") {
    throw new Error(`Invalid DG page: ${slug} — missing summary_30s`);
  }
  const s = summary as Record<string, unknown>;
  if (typeof s.most_likely_cause !== "string" || !String(s.most_likely_cause).trim()) {
    throw new Error(`Invalid DG page: ${slug} — summary_30s.most_likely_cause`);
  }

  const mermaid = content.decision_tree_mermaid;
  if (typeof mermaid !== "string" || mermaid.trim().length < 20) {
    throw new Error(`Invalid DG page: ${slug} — decision_tree_mermaid`);
  }

  const paths = content.paths;
  if (!Array.isArray(paths) || paths.length < 1) {
    throw new Error(`Invalid DG page: ${slug} — paths`);
  }

  const checks = content.quick_checks;
  if (!Array.isArray(checks) || checks.length < 1) {
    throw new Error(`Invalid DG page: ${slug} — quick_checks`);
  }
}
