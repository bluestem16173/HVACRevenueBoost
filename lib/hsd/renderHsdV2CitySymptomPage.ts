import { hsdSectionDomId } from "./mermaidClickMap";
import { simpleDiagnosticFlowToMermaid } from "./simpleDiagnosticFlowToMermaid";

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

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function formatMoney(n: unknown): string {
  if (typeof n === "number" && Number.isFinite(n)) return String(n);
  if (typeof n === "string" && n.trim() && !Number.isNaN(Number(n))) return String(Number(n));
  return String(n ?? "");
}

function subhead(c: Record<string, unknown>): string {
  const city = stringField(c, "city").trim();
  const sym = stringField(c, "symptom").trim();
  const v = stringField(c, "vertical").trim().toUpperCase();
  if (city && sym) return `${v ? `${v} · ` : ""}${city} — ${sym}`;
  if (city) return `${v ? `${v} · ` : ""}${city}`;
  return v || "Local diagnostic";
}

/** Static HTML for **hsd_v2** conversion JSON: Mermaid from `diagnostic_flow`, repair matrix, pro/home/risk steps. */
export function renderHsdV2CitySymptomPage(content: Record<string, unknown>): string {
  const c = content && typeof content === "object" ? content : {};
  const title = stringField(c, "title").trim() || "Diagnostic guide";

  const s30 = asObj(c.summary_30s);
  const headline = s30 ? escapeHtml(stringField(s30, "headline")) : "";
  const coreTruth = s30 ? escapeHtml(stringField(s30, "core_truth")) : "";
  const riskTop = s30 ? escapeHtml(stringField(s30, "risk_warning")) : "";
  let topCausesHtml = "";
  if (s30 && Array.isArray(s30.top_causes)) {
    topCausesHtml = `<ul class="hsd-v2__causes">${s30.top_causes
      .map((x) => {
        const o = asObj(x);
        if (!o) return "";
        return `<li><strong>${escapeHtml(stringField(o, "label"))}</strong> — ${escapeHtml(
          stringField(o, "probability")
        )}</li>`;
      })
      .join("")}</ul>`;
  }

  const checksRaw = c.quick_checks;
  let checksHtml = "";
  if (Array.isArray(checksRaw)) {
    checksHtml = `<ol class="hsd-cred__quick-list hsd-v2__checks">${checksRaw
      .map((item) => {
        const o = asObj(item);
        if (!o) return "";
        return `<li><strong>${escapeHtml(stringField(o, "check"))}</strong>
  <div class="hsd-v2__sub"><em>Homeowner:</em> ${escapeHtml(stringField(o, "homeowner"))}</div>
  <div class="hsd-v2__sub"><em>What it means:</em> ${escapeHtml(stringField(o, "result_meaning"))}</div>
  <div class="hsd-v2__sub"><em>Next step:</em> ${escapeHtml(stringField(o, "next_step"))}</div>
  <div class="hsd-v2__sub"><em>If ignored:</em> ${escapeHtml(stringField(o, "risk"))}</div>
</li>`;
      })
      .join("")}</ol>`;
  }

  const stepsRaw = c.diagnostic_steps;
  let stepsHtml = "";
  if (Array.isArray(stepsRaw)) {
    stepsHtml = `<ol class="hsd-v2__logic">${stepsRaw
      .map((row) => {
        const o = asObj(row);
        if (!o) return "";
        const step = escapeHtml(stringField(o, "step"));
        return `<li><strong>${step}</strong>
  <div class="hsd-v2__sub"><em>Homeowner:</em> ${escapeHtml(stringField(o, "homeowner"))}</div>
  <div class="hsd-v2__sub"><em>Pro:</em> ${escapeHtml(stringField(o, "pro"))}</div>
  <div class="hsd-v2__sub"><em>Risk:</em> ${escapeHtml(stringField(o, "risk"))}</div>
</li>`;
      })
      .join("")}</ol>`;
  }

  const chart = simpleDiagnosticFlowToMermaid(c.diagnostic_flow);
  const mermaidBlock =
    chart.trim().length > 0
      ? `
<section class="hsd-figure" aria-label="Visual diagnostic flow">
  <h2 class="hsd-section__title">Visual diagnostic flow</h2>
  <div class="hsd-figure__surface rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
    Branch chart is not rendered in this build; follow the text branches above.
  </div>
</section>`.trim()
      : "";

  const rm = c.repair_matrix;
  let matrixHtml = "";
  if (Array.isArray(rm) && rm.length > 0) {
    const rows = rm
      .map((row) => {
        const o = asObj(row);
        if (!o) return "";
        const issue = escapeHtml(stringField(o, "issue"));
        const fix = escapeHtml(stringField(o, "fix"));
        const lo = formatMoney(o.cost_min);
        const hi = formatMoney(o.cost_max);
        const diff = escapeHtml(String(o.difficulty ?? ""));
        return `<tr><td>${issue}</td><td>${fix}</td><td>$${escapeHtml(lo)}–$${escapeHtml(
          hi
        )}</td><td>${diff}</td></tr>`;
      })
      .join("");
    matrixHtml = `
<section class="hsd-section" id="${hsdSectionDomId("repair_matrix")}">
  <h2 class="hsd-section__title">Repair matrix</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    <table class="hsd-v2__matrix"><thead><tr><th>Issue</th><th>Fix</th><th>Cost (est.)</th><th>Difficulty</th></tr></thead><tbody>${rows}</tbody></table>
  </div>
</section>`.trim();
  }

  const costEsc = c.cost_escalation;
  let costHtml = "";
  if (Array.isArray(costEsc)) {
    costHtml = `<ol class="hsd-v2__cost-esc">${costEsc
      .map((row) => {
        const o = asObj(row);
        if (!o) return "";
        return `<li><strong>${escapeHtml(stringField(o, "stage"))}</strong> — ${escapeHtml(
          stringField(o, "description")
        )} <span class="hsd-v2__muted">(${escapeHtml(stringField(o, "cost"))})</span></li>`;
      })
      .join("")}</ol>`;
  }

  const dec = asObj(c.decision);
  let decisionHtml = "";
  if (dec) {
    const list = (key: string, label: string) => {
      const a = dec[key];
      if (!Array.isArray(a)) return "";
      const items = a
        .filter((x) => typeof x === "string" && x.trim())
        .map((x) => `<li>${escapeHtml(x as string)}</li>`)
        .join("");
      return `<div><h3 class="hsd-v2__h3">${escapeHtml(label)}</h3><ul>${items}</ul></div>`;
    };
    decisionHtml = `<section class="hsd-section" id="${hsdSectionDomId("decision")}">
  <h2 class="hsd-section__title">Decision</h2>
  <div class="hsd-section__body hsd-v2__cols">
    ${list("safe", "Safe — basic checks")}
    ${list("call_pro", "Call a pro")}
    ${list("stop_now", "Stop — risk of damage")}
  </div>
</section>`;
  }

  const ctaBlock =
    typeof c.cta === "string" && c.cta.trim()
      ? `<div class="hsd-standout hsd-standout--cta" id="${hsdSectionDomId("cta")}"><p>${escapeHtml(
          c.cta
        )}</p></div>`
      : "";

  const credFrame = `
<header class="hsd-cred" data-hsd-zone="credibility">
  <h1 class="hsd-cred__title">${escapeHtml(title)}</h1>
  <p class="hsd-cred__sub">${escapeHtml(subhead(c))}</p>
  <section class="hsd-cred__summary" id="${hsdSectionDomId("summary_30s")}" aria-labelledby="hsd-30s-label">
    <h2 id="hsd-30s-label" class="hsd-cred__summary-head">30-second summary</h2>
    <p class="hsd-cred__summary-lead">${headline}</p>
    <div class="hsd-cred__summary-body">${coreTruth}</div>
    ${topCausesHtml ? `<div class="hsd-v2__top-causes">${topCausesHtml}</div>` : ""}
    ${
      riskTop
        ? `<p class="hsd-v2__risk" role="alert"><strong>Risk if ignored:</strong> ${riskTop}</p>`
        : ""
    }
  </section>
  <hr class="hsd-cred__rule" />
  <section class="hsd-cred__quick" id="${hsdSectionDomId("quick_checks")}" aria-labelledby="hsd-quick-label">
    <h2 id="hsd-quick-label" class="hsd-cred__quick-head">Quick checks (Do this first)</h2>
    ${checksHtml || `<p class="hsd-cred__quick-fallback"></p>`}
  </section>
</header>`.trim();

  const body = `
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("diagnostic_steps")}" class="hsd-section__title">Diagnostic steps</h2>
  <div class="hsd-section__body">${stepsHtml}</div>
</section>
${matrixHtml}
<section class="hsd-section">
  <h2 id="${hsdSectionDomId("cost_escalation")}" class="hsd-section__title">Cost escalation</h2>
  <div class="hsd-section__body">${costHtml}</div>
</section>
${decisionHtml}
<section class="hsd-section hsd-section--stop">
  <h2 id="${hsdSectionDomId("final_warning")}" class="hsd-section__title">Final warning</h2>
  <div class="hsd-section__body"><p>${escapeHtml(stringField(c, "final_warning"))}</p></div>
</section>
${ctaBlock}
`.trim();

  return `${credFrame}\n${mermaidBlock}\n${body}`;
}
