import { HSD_LOCKED_BODY_KEYS } from "./constants";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { hsdSectionDomId } from "./mermaidClickMap";
import {
  buildDiagnosticFlowGraph,
  graphToMermaid,
  isHsdDiagnosticFlowGraph,
} from "./diagnosticFlowGraph";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stringField(data: Record<string, unknown>, key: string): string {
  return typeof data[key] === "string" ? (data[key] as string) : "";
}

/** @deprecated Prefer passing full `content_json` into {@link renderHSDPage}. */
export function pickHsdLockedBody(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of HSD_LOCKED_BODY_KEYS) {
    out[k] = stringField(data, k);
  }
  return out;
}

function inferVerticalFromSlug(slug: unknown): "hvac" | "plumbing" | "electrical" | null {
  if (typeof slug !== "string") return null;
  const head = slug.split("/").filter(Boolean)[0]?.toLowerCase();
  if (head === "hvac" || head === "plumbing" || head === "electrical") return head;
  return null;
}

function subheadFromStorageSlug(slug: string): string {
  const parts = slug.split("/").filter(Boolean);
  const vertical = (parts[0] || "Service").toUpperCase();
  const citySlug = parts[2] || "";
  const city = citySlug ? formatCityPathSegmentForDisplay(citySlug) : "";
  return city ? `${vertical} · ${city}` : vertical;
}

function resolveMermaidSource(data: Record<string, unknown>): string {
  if (isHsdDiagnosticFlowGraph(data.diagnostic_flow)) {
    return graphToMermaid(data.diagnostic_flow);
  }
  const legacy = String(data.mermaid_flow ?? "").trim();
  if (legacy.toLowerCase().includes("flowchart")) {
    return legacy;
  }
  const v = inferVerticalFromSlug(data.slug);
  const issueGuess = stringField(data, "hero").slice(0, 120) || "Issue";
  if (v) {
    return graphToMermaid(buildDiagnosticFlowGraph(v, issueGuess));
  }
  return "";
}

/** Turn decision_tree prose into a tight list for the credibility zone. */
function quickCheckListItems(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const lines = t
    .split(/\n+/)
    .map((s) => s.replace(/^[\s\-*•\d.)]+/i, "").trim())
    .filter((s) => s.length > 0);
  if (lines.length >= 2) {
    return lines.slice(0, 12);
  }
  const chunks = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  if (chunks.length >= 2) {
    return chunks.slice(0, 10);
  }
  return [t];
}

function h1Title(c: Record<string, unknown>): string {
  const title = stringField(c, "title").trim();
  if (title) return title;
  const hero = stringField(c, "hero").trim();
  if (!hero) return "Diagnostic guide";
  const firstLine = hero.split(/\n+/)[0]?.trim() || hero;
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine;
}

/**
 * Single HTML template for HSD locked pages — runtime only (not persisted for DG contract rows).
 * Visual system: locked credibility frame (no color blocks), then diagram + neutral sections.
 */
export function renderHSDPage(content: Record<string, unknown>): string {
  const c = content && typeof content === "object" ? content : {};
  const e = (k: string) => escapeHtml(stringField(c, k));
  const chart = resolveMermaidSource(c);
  const slug = stringField(c, "slug");
  const sub = slug ? subheadFromStorageSlug(slug) : "";

  const checks = quickCheckListItems(stringField(c, "decision_tree"));
  const checksHtml =
    checks.length > 0
      ? `<ul class="hsd-cred__quick-list">${checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : `<p class="hsd-cred__quick-fallback">${e("decision_tree")}</p>`;

  const credFrame = `
<header class="hsd-cred" data-hsd-zone="credibility">
  <h1 class="hsd-cred__title">${escapeHtml(h1Title(c))}</h1>
  <p class="hsd-cred__sub">${escapeHtml(sub)}</p>
  <section class="hsd-cred__summary" id="${hsdSectionDomId("problem_overview")}" aria-labelledby="hsd-30s-label">
    <h2 id="hsd-30s-label" class="hsd-cred__summary-head">30-Second Diagnosis</h2>
    <div class="hsd-cred__summary-body">${e("problem_overview")}</div>
  </section>
  <hr class="hsd-cred__rule" />
  <section class="hsd-cred__quick" id="${hsdSectionDomId("decision_tree")}" aria-labelledby="hsd-quick-label">
    <h2 id="hsd-quick-label" class="hsd-cred__quick-head">Quick Checks</h2>
    ${checksHtml}
  </section>
</header>`.trim();

  const electricSafetyAside = `<aside class="hsd-electric-safety-notice" role="note" aria-label="Electrical safety"><span class="hsd-electric-safety-notice__icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></span><p class="hsd-electric-safety-notice__text">Working with live electricity carries significant risk for injury and possibly death. If you are not experienced, do NOT attempt any DIY. Call a professional today.</p></aside>`;

  const mermaidBlock =
    String(chart).trim().length > 0
      ? `
<section class="hsd-figure" aria-label="Visual diagnostic flow">
  <h2 id="${hsdSectionDomId("mermaid_flow")}" class="hsd-section__title">Visual Diagnostic Flow</h2>
  <div class="hsd-figure__surface rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
    Branch chart is not rendered in this build; follow the text branches above.
  </div>
</section>`.trim()
      : "";

  const body = `
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("how_system_works")}" class="hsd-section__title">How the System Works</h2>
  <div class="hsd-section__body"><p>${e("how_system_works")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("top_causes")}" class="hsd-section__title">Top Causes</h2>
  <div class="hsd-section__body"><p>${e("top_causes")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("cost_matrix")}" class="hsd-section__title">Repair Cost Matrix</h2>
  <div class="hsd-section__body"><p>${e("cost_matrix")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("repair_vs_replace")}" class="hsd-section__title">Repair vs Replace</h2>
  <div class="hsd-section__body"><p>${e("repair_vs_replace")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("electrical_warning")}" class="hsd-section__title">Electrical Warning</h2>
  <div class="hsd-section__body"><p>${e("electrical_warning")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("field_insight")}" class="hsd-section__title">Field Insight</h2>
  <div class="hsd-section__body"><p>${e("field_insight")}</p></div>
</section>
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("maintenance")}" class="hsd-section__title">Maintenance</h2>
  <div class="hsd-section__body"><p>${e("maintenance")}</p></div>
</section>
<div class="hsd-standout hsd-standout--plain" id="${hsdSectionDomId("decision_moment")}"><p>${e("decision_moment")}</p></div>
<div class="hsd-standout hsd-standout--plain" id="${hsdSectionDomId("cost_pressure")}"><p>${e("cost_pressure")}</p></div>
<div class="hsd-standout hsd-standout--cta" id="${hsdSectionDomId("cta")}"><p>${e("cta")}</p></div>
<section class="hsd-section hsd-section--stop">
  <h2 id="${hsdSectionDomId("stop_diy")}" class="hsd-section__title">When to Stop DIY</h2>
  <div class="hsd-section__body"><p>${e("stop_diy")}</p></div>
</section>
`.trim();

  return `${credFrame}\n${electricSafetyAside}\n${mermaidBlock}\n${body}`;
}

const MERMAID_WRAPPER = '<div class="mermaid">';

/**
 * Split `renderHSDPage` output so the Mermaid source can be rendered via `mermaid.render` (client).
 */
export function splitLockedHsdRenderedHtml(html: string): { before: string; chart: string; after: string } {
  const start = html.indexOf(MERMAID_WRAPPER);
  if (start === -1) {
    return { before: html, chart: "", after: "" };
  }
  const contentStart = start + MERMAID_WRAPPER.length;
  const closeIdx = html.indexOf("</div>", contentStart);
  if (closeIdx === -1) {
    return { before: html, chart: "", after: "" };
  }
  const chart = html.slice(contentStart, closeIdx).trim();
  const before = html.slice(0, start);
  const after = html.slice(closeIdx + "</div>".length);
  return { before, chart, after };
}
