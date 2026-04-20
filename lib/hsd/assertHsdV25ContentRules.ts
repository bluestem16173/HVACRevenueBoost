import type { HsdV25Payload } from "@/lib/validation/hsdV25Schema";
import { assertNoForbiddenScaffoldingInPayload } from "@/lib/hsd/assertHsdScaffolding";
import { collectAllStringLeaves } from "@/lib/hsd/hsdJsonStringLeaves";
import {
  LOCKED_AC_NOT_COOLING_HEADLINE,
  isAcNotCoolingCitySlug,
} from "@/lib/hsd/lockedAcNotCoolingHeadline";

/** Largest dollar amount parsed from strings like "$1,500", "$3k+", "$2200–$9500". */
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

function countSubstringAcrossPayloadStrings(page: HsdV25Payload, needle: string): number {
  if (!needle) return 0;
  const acc: string[] = [];
  collectAllStringLeaves(page, acc);
  const blob = acc.join("\u0000");
  let n = 0;
  let pos = 0;
  while ((pos = blob.indexOf(needle, pos)) !== -1) {
    n++;
    pos += needle.length;
  }
  return n;
}

/** Each canonical truth (length ≥ 12) may appear at most twice across all string fields combined. */
function assertCanonicalTruthRepetitionBudget(page: HsdV25Payload): void {
  const truths = (page.canonical_truths ?? []).map((t) => String(t).trim()).filter((t) => t.length >= 12);
  for (const t of truths) {
    const c = countSubstringAcrossPayloadStrings(page, t);
    if (c > 2) {
      throw new Error(
        `canonical_truths text appears more than twice across JSON (${c} hits) — vary wording or shorten duplicates`
      );
    }
  }
}

const QUICK_CHECK_BOUNDARY_SNIPPET = "If not fixed, this is no longer a simple issue";
/** Renderer prints this lead — forbid duplicating it inside JSON quick_checks. */
const QUICK_CHECK_RENDERER_LEAD_SNIPPET = "If cooling does not return after these checks";

function verticalFromSlug(slug: string): string {
  return String(slug ?? "").split("/")[0]?.trim().toLowerCase() || "hvac";
}

function assertSummaryHeadlineTone(slug: string, headline: string): void {
  const h = String(headline ?? "").trim();
  if (isAcNotCoolingCitySlug(slug)) {
    if (h !== LOCKED_AC_NOT_COOLING_HEADLINE) {
      throw new Error(
        `summary_30s.headline must be exactly "${LOCKED_AC_NOT_COOLING_HEADLINE}" for hvac/ac-not-cooling/* pages`
      );
    }
    return;
  }
  if (h.length < 50) {
    throw new Error("summary_30s.headline must be at least 50 characters (direct diagnosis gate + load context)");
  }
  if (
    /\b(understanding|guide|learn\s+about|in\s+this\s+article|in\s+this\s+guide|we\s+will\s+explore|we'll\s+explore)\b/i.test(
      h
    )
  ) {
    throw new Error(
      "summary_30s.headline must start as a direct diagnosis gate (technician voice), not article scaffolding — remove words like understanding / guide / learn about / explore"
    );
  }
}

function assertCtaStrength(cta: string, vertical: string): void {
  const t = String(cta ?? "").trim();
  if (maxParsedUsdInText(t) < 1500) {
    throw new Error("cta must include a cost consequence at $1,500+ (digits with $)");
  }
  const stressOk =
    vertical === "hvac"
      ? /\b(heat|humidity|humid|runtime|load|operating|fault|design|stress|peak|outdoor)\b/i.test(t)
      : /\b(water|pressure|runtime|load|arc|fault|stress|peak|wet|flow|voltage|panel|breaker|leak|freeze)\b/i.test(
          t
        );
  if (!stressOk) {
    throw new Error(
      "cta must reference runtime or environmental stress (e.g. heat, humidity, load, fault conditions)"
    );
  }
  if (!/\b(technician|licensed|tech\b|call\s+a\s*pro|get\s+a\s*pro|book|service\s*call|schedule)\b/i.test(t)) {
    throw new Error("cta must include a direct professional action (e.g. get a technician, book a service call)");
  }
}

/** Extra invariants beyond Zod (explicit failures for workers / publish gates). */
export function assertHsdV25ContentRules(page: HsdV25Payload): void {
  assertNoForbiddenScaffoldingInPayload(page);

  assertCanonicalTruthRepetitionBudget(page);

  assertSummaryHeadlineTone(page.slug, page.summary_30s.headline);

  if (!page.quick_table || page.quick_table.length < 4) {
    throw new Error("quick_table must have at least 4 rows (Quick checks scan table)");
  }

  const qcBlob = JSON.stringify(page.quick_checks ?? []);
  if (qcBlob.includes(QUICK_CHECK_BOUNDARY_SNIPPET)) {
    throw new Error(
      "quick_checks must not embed the legacy site boundary line — the renderer owns decisive framing"
    );
  }
  if (qcBlob.includes(QUICK_CHECK_RENDERER_LEAD_SNIPPET)) {
    throw new Error(
      "quick_checks must not duplicate the site quick-checks lead — keep decisive framing in the renderer only"
    );
  }

  if (!page.repair_matrix?.length) throw new Error("No repair matrix");

  const hasHighCost = page.repair_matrix.some((r) => r.cost_max >= 1500);
  if (!hasHighCost) {
    throw new Error("repair_matrix missing high-cost scenario");
  }

  const stopNow = page.decision?.stop_now ?? [];
  if (stopNow.length < 2) {
    throw new Error("Missing stop_now conditions");
  }
  const hasCriticalLanguage = stopNow.some((item) =>
    /grinding|burning|smoke|shut off|immediately/i.test(item)
  );
  if (!hasCriticalLanguage) {
    throw new Error("stop_now lacks critical urgency language");
  }

  if (!page.summary_30s?.risk_warning.includes("$")) throw new Error("No cost risk");

  const summaryFlowLines = (page.summary_30s.flow_lines ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (summaryFlowLines.length < 4) {
    throw new Error("summary_30s.flow_lines must have at least 4 non-empty lines (DG scan block under headline)");
  }

  if (!page.final_warning.includes("$")) {
    throw new Error("final_warning must include a dollar cost anchor");
  }

  const wtm = (page.what_this_means ?? "").trim();
  if (wtm.length < 100) {
    throw new Error("what_this_means must be at least 100 characters (expert bridge after summary)");
  }

  const rmi = (page.repair_matrix_intro ?? "").trim();
  if (rmi.length < 50) {
    throw new Error("repair_matrix_intro must be at least 50 characters (decisive line above repair table)");
  }

  const df = (page.decision_footer ?? "").trim();
  if (df.length < 35) {
    throw new Error("decision_footer must be at least 35 characters (boundary after decision columns)");
  }

  const flow = page.diagnostic_flow;
  if (!flow.nodes || flow.nodes.length < 4) {
    throw new Error("Weak diagnostic_flow: not enough nodes");
  }
  if (!flow.edges || flow.edges.length < 3) {
    throw new Error("Weak diagnostic_flow: not enough edges");
  }

  const escBlob = page.cost_escalation.map((e) => `${e.stage} ${e.description} ${e.cost}`).join(" ");
  if (maxParsedUsdInText(escBlob) < 1500) {
    throw new Error("cost_escalation must reach a $1,500+ scenario (include dollar amounts in stage/description/cost)");
  }

  assertCtaStrength(page.cta, verticalFromSlug(page.slug));
}
