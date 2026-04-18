/** Trim string fields from LLM / legacy JSON. */
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Normalize `repair_matrix` for **dg_authority_v3** rendering and validation.
 * Accepts:
 * - `string[]` (canonical v3)
 * - `object[]` with `{ symptom, cause, fix, cost }` or v2-style `{ symptom, likely_issue, fix_type, estimated_cost }`
 */
export function repairMatrixToDisplayStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push(s);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const symptom = str(o.symptom);
    const cause = str(o.cause ?? o.likely_issue);
    const fix = str(o.fix ?? o.fix_type);
    let cost = str(o.cost ?? o.estimated_cost);
    if (
      !cost &&
      typeof o.cost_min === "number" &&
      typeof o.cost_max === "number" &&
      Number.isFinite(o.cost_min) &&
      Number.isFinite(o.cost_max)
    ) {
      cost = `$${o.cost_min.toLocaleString("en-US")}–$${o.cost_max.toLocaleString("en-US")}`;
    }
    const headline = [symptom, cause].filter(Boolean).join(" — ");
    const action = fix ? (headline ? `${headline} → ${fix}` : fix) : headline;
    const line = cost ? (action ? `${action} → ${cost}` : cost) : action;
    if (line) out.push(line);
  }
  return out;
}
