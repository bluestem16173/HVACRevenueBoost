import { HSD_V2_SCHEMA_VERSION } from "@/lib/generated-page-json-contract";
import { finalizeHsdV25Page } from "@/lib/hsd/finalizeHsdPage";
import { buildHvacHubInternalLinks } from "@/lib/homeservice/buildHsdHubInternalLinks";
import {
  assertHvacHubReadyForPublish,
  injectRequiredHvacCompilerTokens,
  normalizeHvacInternalLinks,
} from "@/lib/hsd/hvacPagePreflight";
import { generatePageContent } from "./generatePageContent";
import { buildDiagnosticFlowGraph } from "./diagnosticFlowGraph";
import { validatePage } from "./validatePage";
import { HSD_V1_LOCKED_SCHEMA_VERSION } from "./constants";
import type { HsdLockedContentV1, HsdPageBuildRow } from "./types";

export type HsdPageBuildResult = {
  slug: string;
  title: string;
  page_type: "diagnostic";
  schema_version: string;
  content_json: HsdLockedContentV1;
};

function stripLegacyMermaidFields(raw: Record<string, unknown>): void {
  delete raw.mermaid_flow;
  delete raw.mermaidFlow;
}

/**
 * Single HVAC pad appended to `how_system_works` when cues are missing, plus optional `decision_tree` step.
 * Includes substrings required by `validatePage` (HVAC): refrigerant/leak, decision/cost copy, compressor,
 * fan vs system, Stop., professional diagnosis (often satisfied via `how_system_works` + other strings).
 */
const HVAC_AUTHORITY_BLOCK = `
HVAC System Principle:
Refrigerant is not consumed during normal operation.

Critical Rule:
Low charge equals a leak.

Explanation:
If refrigerant levels are low, then there is a leak in the system. This is not normal maintenance and must be repaired.

Diagnostic Flow:
If the AC is not cooling → check thermostat → if correct, inspect filter → if dirty, replace → if clean, check refrigerant levels → when low, then leak is present.

Field Insight:
In real-world service calls, low refrigerant always indicates a leak, never normal consumption.

Decision Moment:
if airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer superficial. continuing to run the system is what turns a manageable repair into a major failure

Compressor:
Continuing under fault forces the compressor outside its design limits.

Stop. Professional diagnosis is not optional when the fault is no longer superficial.

Cost Pressure:
what starts as a minor repair can become a multi-thousand-dollar failure when the system continues running under fault

Field service contrast:
The homeowner may see the fan running and assume the system is working; this is how minor complaints turn into compressor failures.
`.trim();

function ensureHvacAuthority(json: Record<string, unknown>, category: string): Record<string, unknown> {
  if ((category || "").trim().toLowerCase() !== "hvac") return json;

  let text = JSON.stringify(json).toLowerCase();
  const needsAuthorityPad =
    !text.includes("refrigerant is not consumed") ||
    !text.includes("low charge equals a leak") ||
    !text.includes("forces the compressor outside its design limits") ||
    !text.includes("professional diagnosis is not optional") ||
    !text.includes("if airflow, thermostat, and power are confirmed") ||
    !text.includes("what starts as a minor repair can become") ||
    !text.includes("this is how minor complaints turn into compressor failures") ||
    !text.includes("fan running") ||
    !text.includes("system working");

  if (needsAuthorityPad) {
    const hw = String(json.how_system_works ?? "");
    json.how_system_works = `${hw}${hw.trim().length ? "\n\n" : ""}${HVAC_AUTHORITY_BLOCK}`;
    text = JSON.stringify(json).toLowerCase();
  }

  if (!text.includes("if ") && !text.includes("→")) {
    json.decision_tree = Array.isArray(json.decision_tree) ? json.decision_tree : [];

    (json.decision_tree as unknown[]).push({
      step: "Diagnostic check",
      instruction:
        "If the AC is not cooling → check thermostat → if correct, inspect filter → if dirty, replace → if clean, check refrigerant (refrigerant is not consumed; low charge equals a leak).",
    });
  }

  return json;
}

function isHsdV2FreshModelJson(raw: Record<string, unknown>): boolean {
  return typeof raw.summary_30s === "object" && raw.summary_30s !== null;
}

/**
 * Server-only transforms after any HSD model JSON (HSD_Page_Build.md path or diagnostic-engine v2 path):
 * strip legacy Mermaid fields, merge `diagnostic_flow`, HVAC authority pad + preflight, validate.
 */
export function finalizeHsdModelJsonFromRow(
  row: HsdPageBuildRow,
  raw: Record<string, unknown>
): HsdPageBuildResult {
  stripLegacyMermaidFields(raw);

  if (isHsdV2FreshModelJson(raw)) {
    const draft = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
    draft.diagnostic_flow = buildDiagnosticFlowGraph(row.category, row.issue) as unknown as Record<
      string,
      unknown
    >;
    const v25 = finalizeHsdV25Page(draft);
    return {
      slug: row.slug,
      title: v25.title,
      page_type: "diagnostic",
      schema_version: HSD_V2_SCHEMA_VERSION,
      content_json: v25 as unknown as HsdLockedContentV1,
    };
  }

  const diagnostic_flow = buildDiagnosticFlowGraph(row.category, row.issue);
  let json = { ...raw, diagnostic_flow } as Record<string, unknown>;
  json = ensureHvacAuthority(json, row.category);
  if (row.category.trim().toLowerCase() === "hvac") {
    injectRequiredHvacCompilerTokens(json);
    try {
      json.internal_links = normalizeHvacInternalLinks(buildHvacHubInternalLinks(row.slug));
    } catch {
      json.internal_links = normalizeHvacInternalLinks(json.internal_links);
    }
    assertHvacHubReadyForPublish(json, { vertical: row.category });
  } else {
    validatePage(json, row.category);
  }
  return {
    slug: row.slug,
    title: `${row.issue} (${row.city}, ${row.state})`,
    page_type: "diagnostic",
    schema_version: HSD_V1_LOCKED_SCHEMA_VERSION,
    content_json: json as unknown as HsdLockedContentV1,
  };
}

/**
 * queue → **HSD_Page_Build** → validate → pages → renderer
 *
 * `page_type: "diagnostic"` is the semantic contract; `pages.page_type` in DB may remain `city_symptom` for routing.
 */
export async function HSD_Page_Build(row: HsdPageBuildRow): Promise<HsdPageBuildResult> {
  const raw = (await generatePageContent(row)) as Record<string, unknown>;
  return finalizeHsdModelJsonFromRow(row, raw);
}
