import { applyDedupeLinesPassToHsdJson } from "@/lib/hsd/dedupeHsdMultilineFields";
import { injectProgrammaticHsdCtas } from "@/lib/hsd/injectProgrammaticHsdCtas";
import { applyQuickChecksLabelNormalizationToHsdJson } from "@/lib/hsd/normalizeHsdQuickChecksLabels";
import { isAcNotCoolingCitySlug } from "@/lib/hsd/lockedAcNotCoolingHeadline";

/** Same dollar parser as {@link assertHsdV25ContentRules} / CTA gate. */
function maxParsedUsdInText(s: string): number {
  let max = 0;
  const re = /\$\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    let n = parseFloat(String(m[1]).replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    if (m[2] && m[2].toLowerCase() === "k") n *= 1000;
    if (n > max) max = n;
  }
  return max;
}

function verticalFromSlug(slug: string): string {
  return String(slug ?? "").split("/")[0]?.trim().toLowerCase() || "hvac";
}

function ctaMeetsBar(cta: string, vertical: string): boolean {
  const t = String(cta ?? "").trim();
  if (t.length < 45) return false;
  if (maxParsedUsdInText(t) < 1500) return false;
  const stressOk =
    vertical === "hvac"
      ? /\b(heat|humidity|humid|runtime|load|operating|fault|design|stress|peak|outdoor)\b/i.test(t)
      : /\b(water|pressure|runtime|load|arc|fault|stress|peak|wet|flow|voltage|panel|breaker|leak|freeze)\b/i.test(
          t
        );
  if (!stressOk) return false;
  if (!/\b(technician|licensed|tech\b|call\s+a\s*pro|get\s+a\s*pro|book|service\s*call|schedule)\b/i.test(t)) {
    return false;
  }
  return true;
}

/** Top-level title + `summary_30s.headline` (Zod ≥50) without forbidden scaffolding words. */
export function ensureHeadline(json: Record<string, unknown>): Record<string, unknown> {
  let title = String(json.title ?? "").trim();
  if (!title || title.length < 10) {
    title = `${title || "HVAC issue"} — causes, fixes, and typical cost bands`;
    json.title = title.slice(0, 200);
  } else if (title.length < 40) {
    json.title = `${title} — causes, fixes, and typical cost bands (2026)`.slice(0, 200);
  }

  const slug = String(json.slug ?? "");
  if (isAcNotCoolingCitySlug(slug)) {
    return json;
  }

  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return json;
  const o = s30 as Record<string, unknown>;
  let h = String(o.headline ?? "").trim();
  if (h.length < 50) {
    const base = (h || title || "HVAC issue").trim();
    o.headline = `${base} — direct diagnosis, field fixes, and cost escalation when faults persist under heat and humidity load.`;
  }
  return json;
}

const CTA_FALLBACK_HVAC =
  "Book a licensed HVAC technician before peak heat and humidity add runtime stress. Delaying can turn a $300 issue into a $2,000+ repair — $1,500+ compressor-class failures are common when faults persist under load.";

const CTA_FALLBACK_DEFAULT =
  "Book a licensed technician before pressure and leak paths worsen. Delays can turn a $300 fix into a $2,000+ repair — $1,500+ damage is common when faults persist under peak water and electrical stress.";

/** Single string `cta` matching Zod + {@link assertCtaStrength}. */
export function ensureCta(json: Record<string, unknown>): Record<string, unknown> {
  const v = verticalFromSlug(String(json.slug ?? ""));
  const cur = String(json.cta ?? "");
  if (ctaMeetsBar(cur, v)) return json;
  json.cta = v === "hvac" ? CTA_FALLBACK_HVAC : CTA_FALLBACK_DEFAULT;
  return json;
}

export function ensureFinalWarning(json: Record<string, unknown>): Record<string, unknown> {
  const fw = String(json.final_warning ?? "").trim();
  if (!fw || fw.length < 60 || !fw.includes("$")) {
    json.final_warning =
      "Ignoring this issue under sustained runtime load can push compressor and coil stress into a $2,000+ repair class once the system keeps operating under fault.";
  }
  return json;
}

function ensureFlowLines(json: Record<string, unknown>): void {
  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return;
  const o = s30 as Record<string, unknown>;
  const lines = Array.isArray(o.flow_lines)
    ? (o.flow_lines as unknown[]).map((x) => String(x).trim()).filter(Boolean)
    : [];
  if (lines.length >= 4) return;
  o.flow_lines = [
    "Fault is active at the equipment:",
    "→ Verify power, mode, setpoint, and register airflow",
    "→ If comfort does not return after basics → stop extended runtime",
    "→ Licensed diagnosis before damage exceeds a $1,500+ repair class",
  ];
}

function ensureRiskWarning(json: Record<string, unknown>): void {
  const s30 = json.summary_30s;
  if (!s30 || typeof s30 !== "object") return;
  const o = s30 as Record<string, unknown>;
  let rw = String(o.risk_warning ?? "").trim();
  if (!rw || !rw.includes("$")) {
    rw =
      "If airflow, charge, or control faults persist under load, small repairs can stack into a $1,500+ failure class—stop extended runtime once comfort stalls.";
    o.risk_warning = rw;
  }
}

function ensureWhatThisMeans(json: Record<string, unknown>): void {
  let w = String(json.what_this_means ?? "").trim();
  if (w.length >= 100) return;
  const pad =
    " The equipment is still moving working fluid and air, but it is failing to shed load at the coil under real outdoor conditions—restriction or charge faults force longer cycles, raise head pressure, and accelerate wear until a major component fails.";
  json.what_this_means = (w + pad).trim().slice(0, 1200);
}

function ensureRepairMatrixIntro(json: Record<string, unknown>): void {
  let r = String(json.repair_matrix_intro ?? "").trim();
  if (r.length >= 50) return;
  json.repair_matrix_intro =
    (r ? `${r} ` : "") +
    "Most failures start as airflow or control-side issues; once sealed-system or compressor problems appear, costs jump quickly—use the matrix below as field-realistic bands, not quotes.";
}

function ensureDecisionFooter(json: Record<string, unknown>): void {
  let d = String(json.decision_footer ?? "").trim();
  if (d.length >= 35) return;
  json.decision_footer =
    (d ? `${d} ` : "") +
    "At this point, continuing to run the system under fault risks compressor and coil damage.";
}

/**
 * Server-side minimums so imperfect LLM JSON still passes Zod + HSD v2.5 publish rules before
 * {@link finalizeHsdV25Page} (no extra model tokens).
 */
export function normalizeHsdV25PreFinalize(json: Record<string, unknown>): Record<string, unknown> {
  injectProgrammaticHsdCtas(json);
  ensureHeadline(json);
  ensureFlowLines(json);
  ensureRiskWarning(json);
  ensureWhatThisMeans(json);
  ensureRepairMatrixIntro(json);
  ensureDecisionFooter(json);
  ensureCta(json);
  ensureFinalWarning(json);
  applyDedupeLinesPassToHsdJson(json);
  applyQuickChecksLabelNormalizationToHsdJson(json);
  return json;
}
