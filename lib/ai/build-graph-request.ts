import { MASTER_GOLD_STANDARD_PROMPT } from "@/lib/content-engine/core";

export type GraphPageType =
  | "system"
  | "symptom"
  | "diagnostic"
  | "cause"
  | "repair"
  | "context"
  | "component"
  | "condition";

export interface GraphInput {
  site: "dg" | "hvac";
  slug: string;
  title: string;
  page_type: GraphPageType;
  existingCandidates?: {
    systems?: string[];
    symptoms?: string[];
    diagnostics?: string[];
    causes?: string[];
    components?: string[];
    context?: string[];
    repairs?: string[];
  };
}

export function buildGraphUserPrompt(input: GraphInput): string {
  return `
Generate graph relationships for this page.

SITE: ${input.site}
SLUG: ${input.slug}
TITLE: ${input.title}
PAGE TYPE: ${input.page_type}

Existing candidate slugs:
${JSON.stringify(input.existingCandidates ?? {}, null, 2)}

Return strict JSON only.
`;
}

export function buildGraphRequest(input: GraphInput) {
  return {
    systemInstruction: MASTER_GOLD_STANDARD_PROMPT,
    userPrompt: buildGraphUserPrompt(input),
  };
}
