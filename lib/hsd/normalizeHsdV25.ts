/** Forces persisted envelope routing to the v2.5 HSD stack ({@link HSDPage}). */
export function forceHsdLayout(json: Record<string, unknown>): Record<string, unknown> {
  json.layout = "hsd_v2";
  return json;
}

function pageVerticalFromJson(json: Record<string, unknown>): string {
  const slug = String(json.slug ?? "").trim();
  return slug.split("/")[0]?.toLowerCase() || "hvac";
}

/**
 * Pre-finalize shape tweaks for locked-narrative → v2.5 payloads.
 * `cta` is built as structured fields then flattened to a string for {@link HSDV25Schema}.
 */
export function normalizeHsdV25(json: Record<string, unknown>): Record<string, unknown> {
  const v = pageVerticalFromJson(json);
  ensureFinalWarning(ensureCta(ensureHeadline(json, v), v), v);
  if (json.cta && typeof json.cta === "object" && !Array.isArray(json.cta)) {
    const c = json.cta as Record<string, unknown>;
    json.cta = `${String(c.primary ?? "").trim()} ${String(c.urgency ?? "").trim()} ${String(c.cost_anchor ?? "").trim()}`
      .replace(/\s+/g, " ")
      .trim();
  }
  return forceHsdLayout(json);
}

function ensureHeadline(json: Record<string, unknown>, vertical: string) {
  const titleStr = String(json.title ?? "").trim();
  if (titleStr.length < 40) {
    const issueWord =
      vertical === "plumbing" ? "Plumbing issue" : vertical === "electrical" ? "Electrical issue" : "HVAC issue";
    json.title = `${titleStr || issueWord} — Causes, Fixes, and Cost Guide (2026)`;
  }
  return json;
}

function ensureCta(json: Record<string, unknown>, vertical: string) {
  if (typeof json.cta === "string") {
    const s = json.cta.trim();
    json.cta = s ? { primary: s, urgency: "", cost_anchor: "" } : {};
  } else {
    json.cta = json.cta || {};
  }

  if (!json.cta.primary) {
    json.cta.primary =
      vertical === "plumbing"
        ? "Urgent: book a licensed plumber now"
        : vertical === "electrical"
          ? "Urgent: book a licensed electrician now"
          : "Book a licensed HVAC technician now";
  }

  if (!json.cta.urgency || !/\$\d/.test(json.cta.urgency)) {
    json.cta.urgency =
      vertical === "plumbing"
        ? "Delaying can turn a $300 fix into $2,000+ water and mold damage"
        : vertical === "electrical"
          ? "Delaying can turn a $300 fix into $2,000+ panel and safety exposure"
          : "Delaying can turn a $300 issue into a $2,000+ repair";
  }

  if (!json.cta.cost_anchor || !/\$\d/.test(json.cta.cost_anchor)) {
    json.cta.cost_anchor =
      vertical === "hvac"
        ? "$1,500+ repairs are common when faults persist"
        : "$1,500+ damage is common when faults persist under load";
  }

  return json;
}

function ensureFinalWarning(json: Record<string, unknown>, vertical: string) {
  if (!json.final_warning || !/\$\d/.test(json.final_warning)) {
    json.final_warning =
      vertical === "plumbing"
        ? "Ignoring this issue can lead to $2,000+ water damage and mold remediation."
        : vertical === "electrical"
          ? "Ignoring this issue can lead to $2,000+ panel, device, and safety-related repairs."
          : "Ignoring this issue can lead to $2,000+ compressor damage.";
  }
  return json;
}
