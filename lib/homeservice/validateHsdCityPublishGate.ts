/**
 * Step 6 — minimum fields required before writing `pages` from HSD city JSON.
 */

export type HsdPublishGateResult = { ok: true } | { ok: false; errors: string[] };

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateHsdCityPublishGate(payload: unknown): HsdPublishGateResult {
  const errors: string[] = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["payload must be a non-null object"] };
  }
  const p = payload as Record<string, unknown>;

  if (!nonEmptyString(p.title)) errors.push("missing title");
  if (!nonEmptyString(p.slug)) errors.push("missing slug");
  if (!nonEmptyString(p.summary_30s)) errors.push("missing summary_30s");

  const qc = p.quick_checks;
  if (!Array.isArray(qc) || qc.filter((x) => nonEmptyString(x)).length < 3) {
    errors.push("quick_checks: need at least 3 non-empty strings");
  }

  const lc = p.likely_causes;
  if (!Array.isArray(lc) || lc.filter((x) => nonEmptyString(x)).length < 3) {
    errors.push("likely_causes: need at least 3 non-empty strings");
  }

  const ds = p.diagnostic_steps;
  if (!Array.isArray(ds) || ds.filter((x) => nonEmptyString(x)).length < 4) {
    errors.push("diagnostic_steps: need at least 4 non-empty strings");
  }

  const rvp = p.repair_vs_pro;
  if (!rvp || typeof rvp !== "object") {
    errors.push("missing repair_vs_pro object");
  }

  const il = p.internal_links;
  if (!il || typeof il !== "object") {
    errors.push("missing internal_links object");
  } else {
    const links = il as Record<string, unknown>;
    if (!nonEmptyString(links.parent)) errors.push("missing internal_links.parent");
    const sib = links.siblings;
    if (!Array.isArray(sib) || sib.filter((x) => nonEmptyString(x)).length < 3) {
      errors.push("internal_links.siblings: need at least 3 non-empty strings");
    }
    if (!nonEmptyString(links.service)) errors.push("missing internal_links.service");
    if (!nonEmptyString(links.authority)) errors.push("missing internal_links.authority");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/** Throws with joined message if validation fails (worker convenience). */
export function assertHsdCityPublishGate(payload: unknown): void {
  const r = validateHsdCityPublishGate(payload);
  if (!r.ok) throw new Error(r.errors.join("; "));
}
