/**
 * Pre-finalize shape tweaks for locked-narrative → v2.5 payloads.
 * `cta` is built as structured fields then flattened to a string for {@link HSDV25Schema}.
 */
export function normalizeHsdV25(json: any) {
  ensureFinalWarning(
    ensureCta(
      ensureHeadline(json)
    )
  );
  if (json.cta && typeof json.cta === "object" && !Array.isArray(json.cta)) {
    const c = json.cta as Record<string, unknown>;
    json.cta = `${String(c.primary ?? "").trim()} ${String(c.urgency ?? "").trim()} ${String(c.cost_anchor ?? "").trim()}`
      .replace(/\s+/g, " ")
      .trim();
  }
  return json;
}

function ensureHeadline(json: any) {
  if (!json.title || json.title.length < 40) {
    json.title = `${json.title || "HVAC Issue"} — Causes, Fixes, and Cost Guide (2026)`;
  }
  return json;
}

function ensureCta(json: any) {
  if (typeof json.cta === "string") {
    const s = json.cta.trim();
    json.cta = s ? { primary: s, urgency: "", cost_anchor: "" } : {};
  } else {
    json.cta = json.cta || {};
  }

  if (!json.cta.primary) {
    json.cta.primary = "Book a licensed HVAC technician now";
  }

  if (!json.cta.urgency || !/\$\d/.test(json.cta.urgency)) {
    json.cta.urgency =
      "Delaying can turn a $300 issue into a $2,000+ repair";
  }

  if (!json.cta.cost_anchor || !/\$\d/.test(json.cta.cost_anchor)) {
    json.cta.cost_anchor =
      "$1,500+ repairs are common when faults persist";
  }

  return json;
}

function ensureFinalWarning(json: any) {
  if (!json.final_warning || !/\$\d/.test(json.final_warning)) {
    json.final_warning =
      "Ignoring this issue can lead to $2,000+ compressor damage.";
  }
  return json;
}
