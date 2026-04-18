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

/** Lower `priority` renders earlier (after the fixed credibility header). */
export const HSD_V25_BLOCK_PRIORITY = {
  diagnostic_steps: 10,
  decision_tree_text: 12,
  quick_table: 15,
  tools: 17,
  visual_diagnostic_flow: 20,
  repair_matrix: 30,
  cost_escalation: 40,
  decision: 100,
  cta: 200,
  final_warning: 300,
} as const;

export type HsdV25HtmlBlock = { priority: number; html: string };

export function joinSortedHsdV25Blocks(blocks: HsdV25HtmlBlock[]): string {
  return [...blocks]
    .filter((b) => b.html.trim().length > 0)
    .sort((a, b) => a.priority - b.priority)
    .map((b) => b.html)
    .join("\n");
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Split on blank lines for `final_warning` / `cta` (JSON may use \\n\\n between paragraphs). */
function bodyParagraphsHtml(s: string, pClass: string): string {
  return String(s ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="${pClass}">${escapeHtml(p)}</p>`)
    .join("");
}

/** Prefix → for DG flow lines when the model omitted the glyph. */
function dgArrowLine(s: string): string {
  const t = String(s ?? "").trim();
  if (!t) return "";
  if (/^(?:→|->)\s*/.test(t)) return t;
  return `→ ${t}`;
}

function decisionFailureHook(vertical: string | undefined): string {
  const v = String(vertical ?? "").trim().toLowerCase();
  if (v === "hvac") return "→ This is how compressors fail.";
  if (v === "plumbing") return "→ This is how small leaks become major damage.";
  if (v === "electrical") return "→ This is how arc faults and panel damage start.";
  return "→ This is how minor issues become major failures.";
}

/** Intentional repetition: same 1–2 lines echoed in summary, steps, and final warning (plus model prose). */
function canonicalTruthsEchoHtml(
  truths: HsdV25Payload["canonical_truths"] | undefined,
  variant: "summary" | "steps" | "final"
): string {
  const lines = (truths ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return "";
  const lis = lines.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
  const mod =
    variant === "summary"
      ? "mt-4 border-t border-slate-200 pt-4 dark:border-slate-600"
      : variant === "steps"
        ? "mt-6 border-t border-slate-200 pt-4 dark:border-slate-600"
        : "mt-4 border-t border-red-200/60 pt-4 dark:border-red-900/40";
  return `<div class="hsd-canonical-echo ${mod}" role="note" aria-label="Core truths">
  <div class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Core truths</div>
  <ul class="mt-1.5 list-none space-y-1.5 p-0 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">${lis}</ul>
</div>`;
}

function subhead(data: HsdV25RenderInput): string {
  const city = String(data.city ?? "").trim();
  const sym = String(data.symptom ?? "").trim();
  const v = String(data.vertical ?? "").trim().toUpperCase();
  if (city && sym) return `${v ? `${v} · ` : ""}${city} — ${sym}`;
  if (city) return `${v ? `${v} · ` : ""}${city}`;
  return v || "";
}

/** Expert bridge after the 30-second summary (diagnosis → physics → wear). Omitted when empty (legacy rows). */
export function sectionWhatThisMeans(text: string | undefined): string {
  const body = String(text ?? "").trim();
  if (!body) return "";
  return `
<section class="hsd-block hsd-what-means my-6 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-5 dark:border-slate-600 dark:bg-slate-900/40" aria-labelledby="hsd-what-means-label">
  <h2 id="hsd-what-means-label" class="text-base font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">What this means</h2>
  <p class="hsd-what-means__body mt-2 m-0 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(body)}</p>
</section>`.trim();
}

export function sectionSummary(
  summary_30s: HsdV25Payload["summary_30s"],
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const flow = (summary_30s.flow_lines ?? []).map((s) => String(s).trim()).filter(Boolean);
  const useDgFlow = flow.length >= 4;

  const causesFull = summary_30s.top_causes
    .map((c) => {
      const deep = String(c.deep_dive ?? "").trim();
      const diveBlock =
        deep.length > 0
          ? `<div class="hsd-cause-deep-dive mt-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(deep)}</div>`
          : "";
      return `<li class="hsd-block">
  <div><span class="hsd-cause">${escapeHtml(c.label)}</span> — <span class="hsd-probability">${escapeHtml(c.probability)}</span></div>${diveBlock}
</li>`;
    })
    .join("");

  const causesCompact = summary_30s.top_causes
    .map(
      (c) => `<li class="hsd-block text-sm leading-snug text-slate-700 dark:text-slate-300">
  <span class="font-semibold text-slate-900 dark:text-white">${escapeHtml(c.label)}</span> — ${escapeHtml(c.probability)}
</li>`
    )
    .join("");

  const flowBlock = useDgFlow
    ? `<div class="hsd-dg-flow mt-3 rounded-md border border-slate-200 bg-white/80 px-3 py-3 font-mono text-[13px] leading-relaxed text-slate-900 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100" role="group" aria-label="Scan branches">${flow.map((line) => `<div class="hsd-dg-flow-line">${escapeHtml(line)}</div>`).join("")}</div>
  <p class="hsd-cred__summary-body mt-3 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(summary_30s.core_truth)}</p>`
    : `<div class="hsd-cred__summary-body hsd-summary text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(summary_30s.core_truth)}</div>`;

  const causesBlock = useDgFlow
    ? `<ul class="hsd-v2__causes mt-3 list-none space-y-1 p-0">${causesCompact}</ul>`
    : `<ul class="hsd-v2__causes">${causesFull}</ul>`;

  return `
<section class="hsd-cred__summary hsd-block" id="${hsdSectionDomId("summary_30s")}" aria-labelledby="hsd-30s-label">
  <p class="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">30-second read</p>
  <h2 id="hsd-30s-label" class="hsd-cred__summary-head text-xl font-black leading-tight text-slate-900 dark:text-white">${escapeHtml(summary_30s.headline)}</h2>
  ${flowBlock}
  ${causesBlock}
  <p class="hsd-v2__risk hsd-risk mt-4 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-100" role="alert">${escapeHtml(summary_30s.risk_warning)}</p>
  ${canonicalTruthsEchoHtml(canonicalTruths, "summary")}
</section>`.trim();
}

/** Optional callout: same lines the author weaves into summary, steps, and final_warning (repetition). */
export function sectionCanonicalTruths(truths: HsdV25Payload["canonical_truths"]): string {
  const lines = (truths ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 2);
  if (!lines.length) return "";
  const items = lines.map((t) => `<li class="hsd-key-truth-line">${escapeHtml(t)}</li>`).join("");
  return `<div class="hsd-key-truths hsd-block my-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/30" role="note" aria-label="Core truths">
  <div class="text-[11px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">Core truths</div>
  <ul class="mt-2 list-none space-y-2 p-0 text-sm font-semibold leading-snug text-amber-950 dark:text-amber-50">${items}</ul>
</div>`.trim();
}

/** Fixed DIY boundary — appended once after the full quick-check list (not stored in JSON). */
const QUICK_CHECK_BOUNDARY_LINE = "→ If not fixed, this is no longer a simple issue";

export function sectionQuickChecks(
  quick_checks: HsdV25Payload["quick_checks"],
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const truth0 = String(canonicalTruths?.[0] ?? "").trim();
  const truthEcho = truth0
    ? `<p class="mb-4 border-l-4 border-amber-400 pl-3 text-sm font-semibold leading-snug text-amber-950 dark:border-amber-600 dark:text-amber-100">${escapeHtml(truth0)}</p>`
    : "";
  const items = quick_checks
    .map((q) => {
      const lines = [q.homeowner, q.result_meaning, q.next_step, q.risk]
        .map((x) => dgArrowLine(String(x ?? "")))
        .filter(Boolean)
        .map((line) => `<div class="text-sm leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(line)}</div>`)
        .join("");
      return `<li class="hsd-check hsd-block">
  <div class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(q.check)}</div>
  <div class="hsd-dg-check-flow mt-2 space-y-1 border-l-2 border-slate-300 pl-3 dark:border-slate-600">${lines}</div>
</li>`;
    })
    .join("");
  const boundary = `<p class="hsd-check-boundary mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-amber-950 dark:border-slate-600 dark:text-amber-100">${escapeHtml(QUICK_CHECK_BOUNDARY_LINE)}</p>`;
  return `
<section class="hsd-cred__quick hsd-block" id="${hsdSectionDomId("quick_checks")}" aria-labelledby="hsd-quick-label">
  <h2 id="hsd-quick-label" class="hsd-cred__quick-head">Quick checks <span class="text-base font-semibold normal-case text-slate-600 dark:text-slate-400">(Do this first)</span></h2>
  ${truthEcho}
  <p class="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">Run these in order: each block is a short branch. If the last line points at dollars or damage, you are past guessing.</p>
  <ol class="hsd-cred__quick-list hsd-v2__checks hsd-quick-checks-list">${items}</ol>
  ${boundary}
</section>`.trim();
}

export function sectionDiagnosticSteps(
  diagnostic_steps: HsdV25Payload["diagnostic_steps"],
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const items = diagnostic_steps
    .map((s) => {
      const lines = [s.homeowner, s.pro, s.risk]
        .map((x) => dgArrowLine(String(x ?? "")))
        .filter(Boolean)
        .map((line) => `<div class="text-sm leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(line)}</div>`)
        .join("");
      return `<li class="hsd-block">
  <div class="text-base font-bold text-slate-900 dark:text-white">${escapeHtml(s.step)}</div>
  <div class="hsd-dg-step-flow mt-2 space-y-1 border-l-2 border-hvac-blue/50 pl-3 dark:border-hvac-gold/50">${lines}</div>
</li>`;
    })
    .join("");
  return `
<section class="hsd-section hsd-block">
  <h2 id="${hsdSectionDomId("diagnostic_steps")}" class="hsd-section__title hsd-section-title">Diagnostic Flow <span class="text-sm font-semibold normal-case text-slate-600 dark:text-slate-400">(What&rsquo;s actually happening)</span></h2>
  <div class="hsd-section__body">
    <p class="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">Each block names the physical branch first, then forces a decision. Follow the arrows in order so you do not treat a control problem as a charge problem—or vice versa.</p>
    <ol class="hsd-v2__logic space-y-6">${items}</ol>${canonicalTruthsEchoHtml(canonicalTruths, "steps")}
  </div>
</section>`.trim();
}

/**
 * Text-only decision tree. Each string may use → or -> between segments; first segment is the question line.
 */
export function sectionDecisionTreeText(lines: HsdV25Payload["decision_tree_text"]): string {
  const raw = (lines ?? []).map((l) => String(l).trim()).filter(Boolean);
  if (!raw.length) return "";
  const blocks = raw
    .map((line) => {
      const parts = line.split(/\s*(?:→|->)\s*/).map((p) => p.trim()).filter(Boolean);
      if (!parts.length) return "";
      if (parts.length === 1) {
        return `<div class="hsd-dtree-block mb-4 last:mb-0"><p class="hsd-dtree-q m-0 font-semibold text-slate-900 dark:text-white">${escapeHtml(parts[0]!)}</p></div>`;
      }
      const head = parts[0]!;
      const tail = parts.slice(1).join(" → ");
      return `<div class="hsd-dtree-block mb-4 last:mb-0">
  <p class="hsd-dtree-q m-0 mb-2 font-semibold text-slate-900 dark:text-white">${escapeHtml(head)}</p>
  <div class="hsd-dtree-branches border-l-2 border-hvac-blue/40 pl-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
    <span class="font-bold text-hvac-blue dark:text-hvac-gold" aria-hidden="true">→</span> ${escapeHtml(tail)}
  </div>
</div>`;
    })
    .filter(Boolean)
    .join("\n");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("decision_tree_text")}">
  <h2 class="hsd-section__title hsd-section-title">Decision tree (text)</h2>
  <div class="hsd-section__body hsd-dtree-text">${blocks}</div>
</section>`.trim();
}

/** Pro tools list + DIY boundary copy. */
export function sectionTools(tools: HsdV25Payload["tools"]): string {
  const list = (tools ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (!list.length) return "";
  const items = list
    .map((t) => {
      const label = t
        .split(/[\s_-]+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
        .join(" ");
      return `<li>${escapeHtml(label)}</li>`;
    })
    .join("\n");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("tools")}">
  <h2 id="hsd-tools-label" class="hsd-section__title hsd-section-title">Tools &amp; verification</h2>
  <div class="hsd-section__body">
    <p class="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300"><strong>This is real technical work</strong> — technicians use the tools below to verify conditions you cannot see from the thermostat alone. Measurements and judgment matter as much as parts. <strong>Not all fixes are DIY-friendly</strong>: high voltage, refrigerant, and combustion work require licensing and proper equipment.</p>
    <ul class="hsd-tools-list list-disc space-y-1 pl-5 text-sm font-semibold text-slate-800 dark:text-slate-200" aria-labelledby="hsd-tools-label">${items}</ul>
  </div>
</section>`.trim();
}

/** Quick Diagnosis table — same data as quick_table, placed under summary (DG hero scan). */
export function sectionQuickDiagnosisTable(
  quick_table: HsdV25Payload["quick_table"],
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const rows = (quick_table ?? [])
    .map((r) => ({
      symptom: String(r.symptom ?? "").trim(),
      cause: String(r.cause ?? "").trim(),
      fix: String(r.fix ?? "").trim(),
    }))
    .filter((r) => r.symptom.length > 0 || r.cause.length > 0 || r.fix.length > 0);
  if (!rows.length) return "";
  const body = rows
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.symptom)}</td>
  <td>${escapeHtml(r.cause)}</td>
  <td>${escapeHtml(r.fix)}</td>
</tr>`
    )
    .join("\n");
  const truth0 = String(canonicalTruths?.[0] ?? "").trim();
  const signatureRepeat = truth0
    ? `<p class="hsd-signature-repeat mt-4 border-l-4 border-amber-500 pl-3 text-sm font-bold leading-snug text-slate-900 dark:border-amber-400 dark:text-slate-100" role="note">${escapeHtml(truth0)}</p>`
    : "";
  return `
<section class="hsd-section hsd-block hsd-quick-diagnosis" id="${hsdSectionDomId("quick_diagnosis")}" aria-labelledby="hsd-quick-dx-label">
  <h2 id="hsd-quick-dx-label" class="hsd-section__title hsd-section-title">Quick Diagnosis</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    <table class="hsd-v2__matrix hsd-quick-table hsd-quick-diagnosis-table font-mono text-[13px]" aria-labelledby="hsd-quick-dx-label">
      <thead>
        <tr>
          <th scope="col">Symptom</th>
          <th scope="col">Likely Cause</th>
          <th scope="col">Fix</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
  ${signatureRepeat}
</section>`.trim();
}

/** Real `<table>`: Symptom | Likely cause | Fix — skips rows where all three cells are empty. */
export function sectionQuickTable(quick_table: HsdV25Payload["quick_table"]): string {
  const rows = (quick_table ?? [])
    .map((r) => ({
      symptom: String(r.symptom ?? "").trim(),
      cause: String(r.cause ?? "").trim(),
      fix: String(r.fix ?? "").trim(),
    }))
    .filter((r) => r.symptom.length > 0 || r.cause.length > 0 || r.fix.length > 0);
  if (!rows.length) return "";
  const body = rows
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.symptom)}</td>
  <td>${escapeHtml(r.cause)}</td>
  <td>${escapeHtml(r.fix)}</td>
</tr>`
    )
    .join("\n");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("quick_table")}">
  <h2 id="hsd-quick-table-label" class="hsd-section__title hsd-section-title">Symptom → likely cause → fix</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    <table class="hsd-v2__matrix hsd-quick-table" aria-labelledby="hsd-quick-table-label">
      <thead>
        <tr>
          <th scope="col">Symptom</th>
          <th scope="col">Likely Cause</th>
          <th scope="col">Fix</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
</section>`.trim();
}

/**
 * Visual flow section from `diagnostic_flow`.
 * Does **not** emit `<div class="mermaid">` — that hook breaks hydration when Mermaid is off.
 */
export function renderMermaid(flow: HsdV25Payload["diagnostic_flow"]): string {
  const chart = simpleDiagnosticFlowToMermaid(flow).trim();
  if (!chart) return "";
  return `
<section class="hsd-figure hsd-block" aria-label="Visual diagnostic flow">
  <h2 class="hsd-section__title hsd-section-title">Visual diagnostic flow</h2>
  <div class="hsd-figure__surface rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
    Branch chart is not rendered in this build; follow the text branches above.
  </div>
</section>`.trim();
}

/** Shown above the repair table when `repair_matrix_intro` is empty (HVAC legacy rows only). */
const HVAC_REPAIR_MATRIX_INTRO_FALLBACK =
  "Most AC failures start as airflow or control issues. Once refrigerant or compressor problems appear, costs increase quickly.";

export function sectionRepairMatrix(
  repair_matrix: HsdV25Payload["repair_matrix"],
  intro?: string,
  vertical?: string
): string {
  let introHtml = String(intro ?? "").trim();
  if (!introHtml && /^hvac$/i.test(String(vertical ?? "").trim())) {
    introHtml = HVAC_REPAIR_MATRIX_INTRO_FALLBACK;
  }
  const introBlock = introHtml
    ? `<p class="hsd-repair-matrix-intro mb-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">${escapeHtml(introHtml)}</p>`
    : "";
  const rows = repair_matrix
    .map((r) => {
      const lo = Number.isFinite(r.cost_min) ? String(r.cost_min) : "";
      const hi = Number.isFinite(r.cost_max) ? String(r.cost_max) : "";
      const hiNum = Number(r.cost_max);
      const costCell =
        Number.isFinite(hiNum) && hiNum >= 1500
          ? `<span class="hsd-cost">$${escapeHtml(lo)}–<span class="hsd-cost-high">$${escapeHtml(hi)}</span></span>`
          : `<span class="hsd-cost">$${escapeHtml(lo)}–$${escapeHtml(hi)}</span>`;
      const issue = String(r.issue ?? "").trim();
      const fix = String(r.fix ?? "").trim();
      const path =
        /→|->/.test(fix) || /→|->/.test(issue)
          ? `${escapeHtml(issue)} — ${escapeHtml(fix)}`
          : `${escapeHtml(issue)} → ${escapeHtml(fix)}`;
      return `<tr>
  <td class="hsd-repair-path text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">${path} — ${costCell}</td>
  <td class="text-sm capitalize text-slate-700 dark:text-slate-300">${escapeHtml(r.difficulty)}</td>
</tr>`;
    })
    .join("");
  return `
<section class="hsd-section hsd-block" id="${hsdSectionDomId("repair_matrix")}">
  <h2 class="hsd-section__title hsd-section-title">Repair matrix</h2>
  <div class="hsd-section__body hsd-v2__table-wrap">
    ${introBlock}
    <table class="hsd-v2__matrix hsd-repair-matrix-dg"><thead><tr><th scope="col">Path (component — reason → action — cost)</th><th scope="col">Tier</th></tr></thead><tbody>${rows}</tbody></table>
  </div>
</section>`.trim();
}

export function sectionCostEscalation(cost_escalation: HsdV25Payload["cost_escalation"]): string {
  const n = cost_escalation.length;
  const items = cost_escalation
    .map((c, i) => {
      const peak = i === n - 1 ? " hsd-cost-esc--peak" : "";
      /** One decisive line: `Stage — $band: what happens` (matches authority spec). */
      const line = `${c.stage} — ${c.cost}: ${c.description}`.trim();
      return `<li class="hsd-block${peak}"><span class="hsd-cost-esc-line font-semibold leading-relaxed text-slate-900 dark:text-slate-100">${escapeHtml(line)}</span></li>`;
    })
    .join("");
  return `
<section class="hsd-section hsd-block">
  <h2 id="${hsdSectionDomId("cost_escalation")}" class="hsd-section__title hsd-section-title"><span aria-hidden="true">⚡</span> Cost escalation</h2>
  <div class="hsd-section__body">
    <p class="hsd-cost-esc-lead mb-4 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">There is no idle recovery while the equipment runs wrong under load. Each tier burns the cheap exit—delay stacks runtime stress until the next tier is the only one left, and the bill jumps.</p>
    <ol class="hsd-v2__cost-esc">${items}</ol>
  </div>
</section>`.trim();
}

export function sectionDecision(
  decision: HsdV25Payload["decision"],
  footer?: string,
  vertical?: string
): string {
  const col = (className: string, title: string, lines: string[]) =>
    `<div class="${className}"><h3 class="hsd-v2__h3">${title}</h3><ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul></div>`;
  const foot = String(footer ?? "").trim();
  const hookLine = foot ? "" : escapeHtml(decisionFailureHook(vertical));
  const hookBlock = hookLine
    ? `<p class="hsd-decision-hook mt-4 text-sm font-bold text-red-900 dark:text-red-200">${hookLine}</p>`
    : "";
  const footBlock = foot
    ? `<p class="hsd-decision-footer mt-4 border-t border-slate-200 pt-4 text-sm font-semibold leading-relaxed text-slate-900 dark:border-slate-600 dark:text-white">${escapeHtml(foot)}</p>`
    : "";
  return `
<section class="hsd-section hsd-decision hsd-block" id="${hsdSectionDomId("decision")}">
  <h2 class="hsd-section__title hsd-section-title">What you should do now</h2>
  <div class="hsd-section__body hsd-v2__cols">
    ${col("hsd-decision-safe", `<span aria-hidden="true">🟦</span> Safe — try first`, decision.safe)}
    ${col("hsd-decision-call", `<span aria-hidden="true">🟨</span> Call a pro — no longer DIY`, decision.call_pro)}
    ${col("hsd-decision-stop", `<span aria-hidden="true">🟥</span> STOP — risk of damage`, decision.stop_now)}
  </div>
  ${hookBlock}
  ${footBlock}
</section>`.trim();
}

export function sectionFinalWarning(
  final_warning: string,
  canonicalTruths?: HsdV25Payload["canonical_truths"]
): string {
  const paras = bodyParagraphsHtml(
    final_warning,
    "text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100"
  );
  return `
<section class="hsd-section hsd-section--stop hsd-block">
  <h2 id="${hsdSectionDomId("final_warning")}" class="hsd-section__title hsd-section-title"><span aria-hidden="true">🔥</span> Final warning</h2>
  <div class="hsd-section__body space-y-3">${paras}${canonicalTruthsEchoHtml(canonicalTruths, "final")}</div>
</section>`.trim();
}

export function sectionCta(cta: string): string {
  const paras = bodyParagraphsHtml(cta, "font-semibold leading-relaxed text-slate-900 dark:text-slate-100");
  return `
<div class="hsd-standout hsd-standout--cta hsd-block" id="${hsdSectionDomId("cta")}">
  <p class="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Next step</p>
  <div class="mt-1 space-y-3">${paras}</div>
</div>`.trim();
}

/** @deprecated Prefer {@link sectionFinalWarning} + {@link sectionCta} via {@link joinSortedHsdV25Blocks}. */
export function sectionFinal(final_warning: string, cta: string): string {
  return `${sectionFinalWarning(final_warning)}\n${sectionCta(cta)}`;
}

/**
 * Full static HTML for a validated **HSD v2.5** (`HsdV25Payload`) page.
 * Use with {@link HsdLockedPageWithMermaid} (same Mermaid split contract as `renderHSDPage`).
 */
export function renderHsdV25(data: HsdV25RenderInput): string {
  const sub = subhead(data);
  const quickDx = sectionQuickDiagnosisTable(data.quick_table, data.canonical_truths);
  const header = `
<header class="hsd-cred" data-hsd-zone="credibility">
  <h1 class="hsd-cred__title">${escapeHtml(data.title)}</h1>
  ${sub ? `<p class="hsd-cred__sub">${escapeHtml(sub)}</p>` : ""}
  ${sectionSummary(data.summary_30s, data.canonical_truths)}
  ${quickDx}
  ${sectionWhatThisMeans(data.what_this_means)}
  <hr class="hsd-cred__rule" />
  ${sectionQuickChecks(data.quick_checks, data.canonical_truths)}
</header>`.trim();

  const P = HSD_V25_BLOCK_PRIORITY;
  const blocks: HsdV25HtmlBlock[] = [
    { priority: P.diagnostic_steps, html: sectionDiagnosticSteps(data.diagnostic_steps, data.canonical_truths) },
    { priority: P.decision_tree_text, html: sectionDecisionTreeText(data.decision_tree_text) },
    { priority: P.quick_table, html: quickDx.trim() ? "" : sectionQuickTable(data.quick_table) },
    { priority: P.tools, html: sectionTools(data.tools) },
    { priority: P.visual_diagnostic_flow, html: renderMermaid(data.diagnostic_flow) },
    {
      priority: P.repair_matrix,
      html: sectionRepairMatrix(data.repair_matrix, data.repair_matrix_intro, data.vertical),
    },
    { priority: P.cost_escalation, html: sectionCostEscalation(data.cost_escalation) },
    { priority: P.decision, html: sectionDecision(data.decision, data.decision_footer, data.vertical) },
    { priority: P.cta, html: sectionCta(data.cta) },
    { priority: P.final_warning, html: sectionFinalWarning(data.final_warning, data.canonical_truths) },
  ];

  return `${header}\n${joinSortedHsdV25Blocks(blocks)}`.trim();
}
