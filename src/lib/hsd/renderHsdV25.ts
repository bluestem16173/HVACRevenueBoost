import { hsdSectionDomId } from "@/lib/hsd/mermaidClickMap";
import { simpleDiagnosticFlowToMermaid } from "@/lib/hsd/simpleDiagnosticFlowToMermaid";
import type { HsdV25Payload } from "@/src/lib/validation/hsdV25Schema";

/** Optional row/envelope fields sometimes merged onto stored `content_json`. */
export type HsdV25RenderInput = HsdV25Payload &
  Partial<{
    city: string;
    symptom: string;
    vertical: string;
  }>;

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function subhead(data: HsdV25RenderInput): string {
  const city = String(data.city ?? "").trim();
  const sym = String(data.symptom ?? "").trim();
  const v = String(data.vertical ?? "").trim().toUpperCase();
  if (city && sym) return `${v ? `${v} · ` : ""}${city} — ${sym}`;
  if (city) return `${v ? `${v} · ` : ""}${city}`;
  return v || "";
}

export function sectionSummary(summary_30s: HsdV25Payload["summary_30s"]): string {
  const causes = summary_30s.top_causes
    .map(
      (c) =>
        `<li class="hsd-block"><span class="hsd-cause">${escapeHtml(c.label)}</span> — <span class="hsd-probability">${escapeHtml(c.probability)}</span></li>`
    )
    .join("");
  return `
<section class="hsd-cred__summary hsd-block" id="${hsdSectionDomId("summary_30s")}" aria-labelledby="hsd-30s-label">
  <h2 id="hsd-30s-label" class="hsd-cred__summary-head">30-second summary</h2>
  <p class="hsd-cred__summary-lead hsd-summary">${escapeHtml(summary_30s.headline)}</p>
  <div class="hsd-cred__summary-body hsd-summary">${escapeHtml(summary_30s.core_truth)}</div>
  <ul class="hsd-v2__causes">${causes}</ul>
  <p class="hsd-v2__risk hsd-risk" role="alert"><strong>Risk if ignored:</strong> ${escapeHtml(summary_30s.risk_warning)}</p>
</section>`.trim();
}

export function sectionQuickChecks(quick_checks: HsdV25Payload["quick_checks"]): string {
  const items = quick_checks
    .map(
      (q) => `<li class="hsd-check hsd-block">
  <div><strong>${escapeHtml(q.check)}</strong></div>
  <div class="hsd-homeowner"><em>Homeowner:</em> ${escapeHtml(q.homeowner)}</div>
  <div class="hsd-meaning"><em>What it means:</em> ${escapeHtml(q.result_meaning)}</div>
  <div class="hsd-meaning"><em>Next step:</em> ${escapeHtml(q.next_step)}</div>
  <div class="hsd-risk"><em>If ignored:</em> ${escapeHtml(q.risk)}</div>
</li>`
    )
    .join("");
  return `
<section class="hsd-cred__quick hsd-block" id="${hsdSectionDomId("quick_checks")}" aria-labelledby="hsd-quick-label">
  <h2 id="hsd-quick-label" class="hsd-cred__quick-head">Quick checks</h2>
  <ol class="hsd-cred__quick-list hsd-v2__checks hsd-quick-checks-list">${items}</ol>
</section>`.trim();
}

export function sectionDiagnosticSteps(diagnostic_steps: HsdV25Payload["diagnostic_steps"]): string {
  const items = diagnostic_steps
    .map(
      (s) => `<li class="hsd-block"><strong>${escapeHtml(s.step)}</strong>
  <div class="hsd-homeowner"><em>Homeowner:</em> ${escapeHtml(s.homeowner)}</div>
  <div class="hsd-pro"><em>Pro:</em> ${escapeHtml(s.pro)}</div>
  <div class="hsd-risk"><em>Risk:</em> ${escapeHtml(s.risk)}</div>
</li>`
    )
    .join("");
  return `
<section class="hsd-section hsd-block">
  <h2 id="${hsdSectionDomId("diagnostic_steps")}" class="hsd-section__title hsd-section-title">Diagnostic steps</h2>
  <div class="hsd-section__body"><ol class="hsd-v2__logic">${items}</ol></div>
</section>`.trim();
}

/** Mermaid block from `diagnostic_flow` (uses shared graph → `flowchart TD` builder). */
export function renderMermaid(flow: HsdV25Payload["diagnostic_flow"]): string {
  const chart = simpleDiagnosticFlowToMermaid(flow).trim();
  if (!chart) return "";
  return `
<section class="hsd-figure hsd-block" aria-label="Visual diagnostic flow">
  <h2 class="hsd-section__title hsd-section-title">Visual diagnostic flow</h2>
  <div class="hsd-figure__surface">
    <div class="mermaid">${chart}</div>
  </div>
</section>`.trim();
}

export function sectionRepairMatrix(repair_matrix: HsdV25Payload["repair_matrix"]): string {
  const rows = repair_matrix
    .map((r) => {
      const lo = Number.isFinite(r.cost_min) ? String(r.cost_min) : "";
      const hi = Number.isFinite(r.cost_max) ? String(r.cost_max) : "";
      const hiNum = Number(r.cost_max);
      const costCell =
        Number.isFinite(hiNum) && hiNum >= 1500
          ? `<span class="hsd-cost">$${escapeHtml(lo)}–<span class="hsd-cost-high">$${escapeHtml(hi)}</span></span>`
          : `<span class="hsd-cost">$${escapeHtml(lo)}–$${escapeHtml(hi)}</span>`;
      return `<tr>
  <td>${escapeHtml(r.issue)}</td>
  <td>${escapeHtml(r.fix)}</td>
  <td class="hsd-cost-cell">${costCell}</td>
  <td>${escapeHtml(r.difficulty)}</td>
</tr>`;
    })
    .join("");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("repair_matrix")}">
  <h2 class="hsd-section__title hsd-section-title">Repair matrix</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    <table class="hsd-v2__matrix"><thead><tr><th>Issue</th><th>Fix</th><th>Cost (est.)</th><th>Difficulty</th></tr></thead><tbody>${rows}</tbody></table>
  </div>
</section>`.trim();
}

export function sectionCostEscalation(cost_escalation: HsdV25Payload["cost_escalation"]): string {
  const n = cost_escalation.length;
  const items = cost_escalation
    .map((c, i) => {
      const peak = i === n - 1 ? " hsd-cost-esc--peak" : "";
      return `<li class="hsd-block${peak}"><strong>${escapeHtml(c.stage)}</strong> — ${escapeHtml(c.description)} <span class="hsd-v2__muted">(<span class="hsd-cost-wrap">${escapeHtml(c.cost)}</span>)</span></li>`;
    })
    .join("");
  return `
<section class="hsd-section hsd-block">
  <h2 id="${hsdSectionDomId("cost_escalation")}" class="hsd-section__title hsd-section-title">Cost escalation</h2>
  <div class="hsd-section__body"><ol class="hsd-v2__cost-esc">${items}</ol></div>
</section>`.trim();
}

export function sectionDecision(decision: HsdV25Payload["decision"]): string {
  const col = (className: string, title: string, lines: string[]) =>
    `<div class="${className}"><h3 class="hsd-v2__h3">${escapeHtml(title)}</h3><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul></div>`;
  return `
<section class="hsd-section hsd-decision hsd-block" id="${hsdSectionDomId("decision")}">
  <h2 class="hsd-section__title hsd-section-title">Decision</h2>
  <div class="hsd-section__body hsd-v2__cols">
    ${col("hsd-decision-safe", "Safe — basic checks", decision.safe)}
    ${col("hsd-decision-call", "Call a pro", decision.call_pro)}
    ${col("hsd-decision-stop", "Stop — risk of damage", decision.stop_now)}
  </div>
</section>`.trim();
}

export function sectionFinal(final_warning: string, cta: string): string {
  return `
<section class="hsd-section hsd-section--stop hsd-block">
  <h2 id="${hsdSectionDomId("final_warning")}" class="hsd-section__title hsd-section-title">Final warning</h2>
  <div class="hsd-section__body"><p>${escapeHtml(final_warning)}</p></div>
</section>
<div class="hsd-standout hsd-standout--cta hsd-block" id="${hsdSectionDomId("cta")}"><p>${escapeHtml(cta)}</p></div>`.trim();
}

/**
 * Full static HTML for a validated **HSD v2.5** (`HsdV25Payload`) page.
 * Use with {@link HsdLockedPageWithMermaid} (same Mermaid split contract as `renderHSDPage`).
 */
export function renderHsdV25(data: HsdV25RenderInput): string {
  const sub = subhead(data);
  const header = `
<header class="hsd-cred" data-hsd-zone="credibility">
  <h1 class="hsd-cred__title">${escapeHtml(data.title)}</h1>
  ${sub ? `<p class="hsd-cred__sub">${escapeHtml(sub)}</p>` : ""}
  ${sectionSummary(data.summary_30s)}
  <hr class="hsd-cred__rule" />
  ${sectionQuickChecks(data.quick_checks)}
</header>`.trim();

  return `
${header}
${sectionDiagnosticSteps(data.diagnostic_steps)}
${renderMermaid(data.diagnostic_flow)}
${sectionRepairMatrix(data.repair_matrix)}
${sectionCostEscalation(data.cost_escalation)}
${sectionDecision(data.decision)}
${sectionFinal(data.final_warning, data.cta)}
`.trim();
}
