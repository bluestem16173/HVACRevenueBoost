/**
 * Pre-publish **intent** checks (documentation + light runtime helpers).
 * Heavy validation stays in `lib/validators/validate-v2.ts`, `lib/validators/page-validator.ts`,
 * and the generation worker (`scripts/generation-worker.ts`).
 */

export type PublishGateResult = { ok: true } | { ok: false; reasons: string[] };

/** Minimum shape before a worker should mark a page published / approved. */
export function evaluatePublishGates(input: {
  slug: string;
  contentJson: unknown | null;
  contentHtml?: string | null;
}): PublishGateResult {
  const reasons: string[] = [];
  const slug = (input.slug || "").trim();
  if (!slug) reasons.push("slug_empty");
  if (input.contentJson == null) reasons.push("content_json_missing");
  else if (typeof input.contentJson === "object" && Object.keys(input.contentJson as object).length === 0) {
    reasons.push("content_json_empty_object");
  }
  const html = input.contentHtml?.trim() ?? "";
  if (html.length < 20) reasons.push("content_html_too_thin");
  if (reasons.length) return { ok: false, reasons };
  return { ok: true };
}

/** Operator checklist — keep in sync with worker behavior. */
export const PUBLISH_GATE_CHECKLIST = [
  "Slug matches queue `proposed_slug` (normalized, no accidental `diagnose/` prefix duplication).",
  "No duplicate intent for the same slug + city + page_type in `generation_queue`.",
  "`content_json` present and non-trivial after schema / validateV2.",
  "Internal links present where the template requires them (see generator + page-validator).",
  "Rendered route returns 200 and readable layout (manual QA for first batch).",
] as const;
