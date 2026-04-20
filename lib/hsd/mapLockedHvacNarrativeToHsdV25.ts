import { coerceHsdJsonForV25View } from "@/lib/hsd/coerceHsdJsonForV25View";
import { finalizeHsdV25Page } from "@/lib/hsd/finalizeHsdPage";
import {
  LOCKED_AC_NOT_COOLING_HEADLINE,
  isAcNotCoolingCitySlug,
} from "@/lib/hsd/lockedAcNotCoolingHeadline";
import { forceHsdLayout, normalizeHsdV25 } from "@/lib/hsd/normalizeHsdV25";
import type { HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

function splitTopCausesBlob(blob: string): Array<{ label: string; probability: string; deep_dive: string }> {
  const t = blob.trim();
  if (!t) {
    return [
      { label: "Airflow restriction", probability: "Common", deep_dive: "Measure supply and return." },
      { label: "Refrigerant loss", probability: "Common", deep_dive: "Low charge equals a leak." },
      { label: "Compressor stress", probability: "Escalation", deep_dive: "Forced runtime damages major parts." },
    ];
  }
  const parts = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks = parts.length >= 3 ? parts.slice(0, 5) : [t, t, t];
  return chunks.slice(0, 5).map((text) => ({
    label: text.slice(0, 90),
    probability: "Field-ranked",
    deep_dive: text,
  }));
}

function diagnosticStepsFromBlob(s: string): Array<{ step: string; homeowner: string; pro: string; risk: string }> {
  const lines = s.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.length ? lines : [s.trim() || "Verify cooling performance against setpoint and airflow."];
  return rows.slice(0, 20).map((line) => ({
    step: line.slice(0, 400),
    homeowner: "→ Compare readings to normal bands; stop if unsafe.",
    pro: "→ Verify with gauges, electrical tests, and load context.",
    risk: "→ Misdiagnosis stacks cost and compressor exposure.",
  }));
}

function stripDiagnosticFlowKinds(flow: unknown): HsdV25Payload["diagnostic_flow"] | undefined {
  if (!flow || typeof flow !== "object") return undefined;
  const f = flow as Record<string, unknown>;
  const nodesRaw = Array.isArray(f.nodes) ? f.nodes : [];
  const nodes = nodesRaw.map((n) => {
    const r = n as Record<string, unknown>;
    return { id: String(r.id ?? "").trim(), label: String(r.label ?? "").trim() };
  }).filter((n) => n.id && n.label);
  const edges = (Array.isArray(f.edges) ? f.edges : []).map((e) => {
    const r = e as Record<string, unknown>;
    return {
      from: String(r.from ?? "").trim(),
      to: String(r.to ?? "").trim(),
      ...(typeof r.label === "string" && r.label.trim() ? { label: r.label.trim() } : {}),
    };
  });
  if (nodes.length < 4 || edges.length < 3) return undefined;
  const ids = new Set(nodes.map((n) => n.id));
  const ok = edges.every((e) => ids.has(e.from) && ids.has(e.to));
  if (!ok) return undefined;
  return { nodes, edges };
}

/**
 * **`HSD_Page_Build` locked narrative** (`validatePage` body + v1 `diagnostic_flow`) → **`hsd_v2` / {@link HSDV25Schema}**
 * for {@link finalizeHsdV25Page} and {@link renderHsdV25}.
 *
 * Padding and minimum row counts are delegated to {@link coerceHsdJsonForV25View}.
 */
export function mapLockedHvacNarrativeToHsdV25Payload(
  locked: Record<string, unknown>,
  meta: { slug: string; title: string }
): HsdV25Payload | null {
  const slug = meta.slug.trim();
  const titleRaw = meta.title.trim();
  const title = titleRaw.length >= 10 ? titleRaw : `${titleRaw} — diagnostic reference`;

  const summaryBlob = String(locked.summary_30s ?? "").trim();
  const headline = isAcNotCoolingCitySlug(slug)
    ? LOCKED_AC_NOT_COOLING_HEADLINE
    : summaryBlob.length >= 50
      ? summaryBlob.slice(0, 180)
      : `${summaryBlob} Start with filter, thermostat, and airflow before sealed-system work.`.trim().slice(0, 200);

  const dt = String(locked.decision_tree ?? "").trim();
  const decisionLines = dt.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const decision_tree_text: string[] = (
    decisionLines.length >= 3 ? decisionLines : [dt, dt, dt].map((x) => x.trim()).filter(Boolean)
  ).slice(0, 20);
  while (decision_tree_text.length < 4) {
    decision_tree_text.push(
      "→ If measured symptoms disagree with assumptions, stop runtime under fault load and schedule a licensed technician.",
    );
  }

  const how = String(locked.how_system_works ?? "").trim();
  const coreTruth = how.length >= 70 ? how : `${how}\n\n${summaryBlob}`.trim();

  const diagnostic_flow = stripDiagnosticFlowKinds(locked.diagnostic_flow);

  const o: Record<string, unknown> = {
    page_type: "city_symptom",
    schema_version: "hsd_v2",
    slug,
    title,
    summary_30s: {
      headline,
      top_causes: splitTopCausesBlob(String(locked.top_causes ?? summaryBlob)),
      core_truth: coreTruth.slice(0, 4000),
      risk_warning:
        "Ignoring the pattern forces coil stress, compressor overload, and typical repair costs of $1,500–$3,500 once major parts fail.",
      flow_lines: decision_tree_text.slice(0, 8),
    },
    what_this_means: how || summaryBlob,
    decision_tree_text,
    diagnostic_steps: diagnosticStepsFromBlob(String(locked.diagnostic_steps ?? "")),
    diagnostic_flow,
    final_warning: (() => {
      const base = `${String(locked.stop_diy ?? "").trim()}\n\n${String(locked.bench_test_notes ?? "").trim()}`.trim();
      const costLine = String(locked.cost_matrix ?? "").trim();
      if (/\$/.test(base)) return base;
      return `${base}\n\n${costLine || "Typical compressor-class failures commonly land $1,500–$3,500 once the system keeps running under fault."}`.trim();
    })(),
    cta: (() => {
      const base = String(locked.replace_vs_repair ?? "").trim();
      const cityHint = /tampa/i.test(slug) ? "Tampa" : /fort-myers/i.test(slug) ? "Fort Myers" : "Local";
      const tail =
        `In ${cityHint} heat and humidity under peak load, running the system under fault stress risks $2,000+ compressor exposure—book a licensed technician before stacked repairs exceed $3,500.`;
      return base ? `${base}\n\n${tail}` : tail;
    })(),
    repair_matrix_intro: String(locked.cost_matrix ?? "").trim().slice(0, 400),
    tools: String(locked.tools_needed ?? "")
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  };

  return coerceHsdJsonForV25View(o);
}

/**
 * Locked narrative → v2.5 payload → {@link normalizeHsdV25} → {@link finalizeHsdV25Page}.
 */
export function mapLockedHvacNarrativeToHsdV25(
  locked: Record<string, unknown>,
  meta: { slug: string; title: string }
): HsdV25Payload | null {
  const payload = mapLockedHvacNarrativeToHsdV25Payload(locked, meta);
  if (!payload) return null;
  const normalized = normalizeHsdV25(payload as Record<string, unknown>);
  forceHsdLayout(normalized);
  return finalizeHsdV25Page(normalized);
}
