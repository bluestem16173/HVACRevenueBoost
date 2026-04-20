import { dedupeLines } from "@/lib/utils";

function dedupeTrimmedStringArray(arr: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const s = String(x ?? "").trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * Removes repeated lines in long LLM blobs (cheap cleanup before Zod / publish gates).
 */
export function applyDedupeLinesPassToHsdJson(json: Record<string, unknown>): void {
  const s30 = json.summary_30s;
  if (s30 && typeof s30 === "object") {
    const o = s30 as Record<string, unknown>;
    if (typeof o.core_truth === "string") o.core_truth = dedupeLines(o.core_truth);
    if (typeof o.risk_warning === "string") o.risk_warning = dedupeLines(o.risk_warning);
    if (typeof o.headline === "string") o.headline = dedupeLines(o.headline);
    if (Array.isArray(o.flow_lines)) {
      o.flow_lines = dedupeTrimmedStringArray(o.flow_lines as unknown[]);
    }
    if (Array.isArray(o.top_causes)) {
      o.top_causes = (o.top_causes as unknown[]).map((c) => {
        if (!c || typeof c !== "object") return c;
        const row = { ...(c as Record<string, unknown>) };
        if (typeof row.deep_dive === "string") row.deep_dive = dedupeLines(row.deep_dive);
        return row;
      });
    }
  }

  if (typeof json.how_system_works === "string") {
    json.how_system_works = dedupeLines(json.how_system_works);
  }
  if (typeof json.what_this_means === "string") {
    json.what_this_means = dedupeLines(json.what_this_means);
  }
  if (typeof json.repair_matrix_intro === "string") {
    json.repair_matrix_intro = dedupeLines(json.repair_matrix_intro);
  }

  if (Array.isArray(json.diagnostic_steps)) {
    json.diagnostic_steps = (json.diagnostic_steps as unknown[]).map((row) => {
      if (!row || typeof row !== "object") return row;
      const r = { ...(row as Record<string, unknown>) };
      for (const k of ["step", "homeowner", "pro", "risk"] as const) {
        if (typeof r[k] === "string") r[k] = dedupeLines(r[k] as string);
      }
      return r;
    });
  }
}
