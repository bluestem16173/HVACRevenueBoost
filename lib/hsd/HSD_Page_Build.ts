import { generatePageContent } from "./generatePageContent";
import { buildDiagnosticFlowGraph } from "./diagnosticFlowGraph";
import { validatePage } from "./validatePage";
import { HSD_V1_LOCKED_SCHEMA_VERSION } from "./constants";
import type { HsdLockedContentV1, HsdPageBuildRow } from "./types";

export type HsdPageBuildResult = {
  slug: string;
  title: string;
  page_type: "diagnostic";
  schema_version: typeof HSD_V1_LOCKED_SCHEMA_VERSION;
  content_json: HsdLockedContentV1;
};

function stripLegacyMermaidFields(raw: Record<string, unknown>): void {
  delete raw.mermaid_flow;
  delete raw.mermaidFlow;
}

/**
 * queue → **HSD_Page_Build** → validate → pages → renderer
 *
 * `page_type: "diagnostic"` is the semantic contract; `pages.page_type` in DB may remain `city_symptom` for routing.
 */
export async function HSD_Page_Build(row: HsdPageBuildRow): Promise<HsdPageBuildResult> {
  const raw = (await generatePageContent(row)) as Record<string, unknown>;
  stripLegacyMermaidFields(raw);
  const diagnostic_flow = buildDiagnosticFlowGraph(row.category, row.issue);
  const content = { ...raw, diagnostic_flow } as unknown as HsdLockedContentV1;
  validatePage(content, row.category);
  return {
    slug: row.slug,
    title: `${row.issue} (${row.city}, ${row.state})`,
    page_type: "diagnostic",
    schema_version: HSD_V1_LOCKED_SCHEMA_VERSION,
    content_json: content,
  };
}
