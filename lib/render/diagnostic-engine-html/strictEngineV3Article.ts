import { repairMatrixToDisplayStrings } from "@/lib/dg/repairMatrixToDisplayStrings";
import { escapeHtml } from "@/lib/render/escapeHtml";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function esc(s: string): string {
  return escapeHtml(s);
}

/** Coerce unknown to array for LLM-shaped JSON (avoids runtime throws on non-arrays). */
export function safeArray<T = unknown>(arr: unknown, fallback: T[] = []): T[] {
  return Array.isArray(arr) ? (arr as T[]) : fallback;
}

function repairMatrixCostCell(o: Record<string, unknown>): string {
  const band = asString(o.cost ?? o.estimated_cost);
  if (band) return band;
  const min = o.cost_min;
  const max = o.cost_max;
  if (typeof min === "number" && typeof max === "number" && Number.isFinite(min) && Number.isFinite(max)) {
    return `$${min.toLocaleString("en-US")}–$${max.toLocaleString("en-US")}`;
  }
  if (typeof min === "number" && Number.isFinite(min)) {
    return `$${min.toLocaleString("en-US")}+`;
  }
  if (typeof max === "number" && Number.isFinite(max)) {
    return `Up to $${max.toLocaleString("en-US")}`;
  }
  return "";
}

export function isStrictEngineV3Json(data: Record<string, unknown>): boolean {
  const hasHero = typeof data.hero === "string" && data.hero.trim().length > 0;
  const fork = asRecord(data.decision_fork);
  const hasFork = fork != null && (asStringArray(fork.safe_diy).length > 0 || asStringArray(fork.call_pro_if).length > 0);
  return hasHero || hasFork;
}

export function renderHero(data: Record<string, unknown>): string {
  const h = asString(data.hero);
  if (!h) return "";
  return `<section class="rounded-xl border border-amber-200 bg-amber-50 p-6 mb-8" aria-label="Field read">
  <p class="text-sm font-semibold uppercase tracking-wide text-amber-900/80 mb-2">Technician read</p>
  <p class="text-gray-900 leading-relaxed">${esc(h)}</p>
</section>`;
}

export function renderSummary(data: Record<string, unknown>): string {
  const summaryObj = asRecord(data.summary_30s);
  if (summaryObj) {
    const most = asString(summaryObj.most_likely_cause);
    const first = asString(summaryObj.what_to_check_first);
    const diy = asString(summaryObj.diy_vs_pro);
    const parts: string[] = [];
    if (most) parts.push(`<p class="mb-2"><span class="font-semibold text-gray-900">Most likely:</span> ${esc(most)}</p>`);
    if (first) parts.push(`<p class="mb-2"><span class="font-semibold text-gray-900">Check first:</span> ${esc(first)}</p>`);
    if (diy) parts.push(`<p class="text-sm text-gray-700"><span class="font-semibold">DIY vs pro:</span> ${esc(diy)}</p>`);
    if (parts.length) {
      return `<section class="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-8" aria-label="Summary">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
  ${parts.join("\n")}
</section>`;
    }
  }
  const s = asString(data.summary_30s);
  if (!s) return "";
  return `<section class="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-8" aria-label="Summary">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
  <p class="text-gray-800 leading-relaxed whitespace-pre-line">${esc(s)}</p>
</section>`;
}

export function renderQuickChecks(data: Record<string, unknown>): string {
  const raw = data.quick_checks;
  if (!Array.isArray(raw) || raw.length === 0) return "";
  const rows: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      rows.push(`<li class="border-b border-green-100 pb-3 last:border-0"><span class="text-green-700 mr-2">✔</span>${esc(item.trim())}</li>`);
      continue;
    }
    const o = asRecord(item);
    if (!o) continue;
    const label = asString(o.label);
    const action = asString(o.action);
    const risk = asString(o.risk_if_ignored);
    if (!label && !action && !risk) continue;
    rows.push(`<li class="border-b border-green-100 pb-4 last:border-0 space-y-1">
  ${label ? `<p class="font-semibold text-gray-900">${esc(label)}</p>` : ""}
  ${action ? `<p class="text-gray-800">${esc(action)}</p>` : ""}
  ${risk ? `<p class="text-sm text-red-800"><span class="font-semibold">Risk if ignored:</span> ${esc(risk)}</p>` : ""}
</li>`);
  }
  if (!rows.length) return "";
  return `<section class="rounded-xl border border-green-200 bg-green-50 p-6 mb-8" aria-label="Quick checks">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Quick checks</h2>
  <ul class="space-y-2 list-none pl-0">${rows.join("\n")}</ul>
</section>`;
}

export function renderDecisionFork(data: Record<string, unknown>): string {
  const fork = asRecord(data.decision_fork);
  if (!fork) return "";
  const safe = asStringArray(fork.safe_diy);
  const pro = asStringArray(fork.call_pro_if);
  const urgency = asString(fork.urgency_level);
  if (!safe.length && !pro.length && !urgency) return "";

  const urgBlock = urgency
    ? `<p class="text-sm font-semibold text-gray-900 mb-4">Urgency: <span class="uppercase">${esc(urgency)}</span></p>`
    : "";

  const safeBlock = safe.length
    ? `<div class="mb-6">
    <h3 class="text-base font-semibold text-green-900 mb-2">Safe to Check</h3>
    <ul class="list-disc pl-5 text-gray-800 space-y-1">${safe.map((i) => `<li>${esc(i.trim())}</li>`).join("")}</ul>
  </div>`
    : "";

  const proBlock = pro.length
    ? `<div>
    <h3 class="text-base font-semibold text-red-950 mb-2">Stop and Call a Pro</h3>
    <ul class="list-disc pl-5 text-gray-800 space-y-1">${pro.map((i) => `<li>${esc(i.trim())}</li>`).join("")}</ul>
  </div>`
    : "";

  return `<section class="decision rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="What you should do next">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">What You Should Do Next</h2>
  ${urgBlock}
  ${safeBlock}
  ${proBlock}
</section>`;
}

export function renderDiagnosticFlow(data: Record<string, unknown>): string {
  const flow = asRecord(data.diagnostic_flow);
  if (!flow) return "";
  const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
  const edges = Array.isArray(flow.edges) ? flow.edges : [];
  const expl = asRecord(data.flow_explanations);
  if (!nodes.length && !edges.length) return "";
  const nodeRows = nodes
    .map((n) => asRecord(n))
    .filter(Boolean)
    .map((n) => {
      const id = asString(n!.id);
      const kind = asString(n!.kind);
      const label = asString(n!.label);
      if (!id && !label) return "";
      return `<tr class="border-b border-gray-100"><td class="py-2 pr-3 font-mono text-xs text-gray-500">${esc(id)}</td><td class="py-2 pr-3 text-xs uppercase text-gray-500">${esc(kind)}</td><td class="py-2 text-gray-800">${esc(label)}</td></tr>`;
    })
    .filter(Boolean);
  const edgeRows = edges
    .map((e) => asRecord(e))
    .filter(Boolean)
    .map((e) => {
      const from = asString(e!.from);
      const to = asString(e!.to);
      const label = asString(e!.label);
      if (!from || !to) return "";
      return `<li><span class="font-mono text-sm">${esc(from)}</span> → <span class="font-mono text-sm">${esc(to)}</span>${label ? ` <span class="text-gray-600">(${esc(label)})</span>` : ""}</li>`;
    })
    .filter(Boolean);
  let explBlock = "";
  if (expl && Object.keys(expl).length) {
    const lines = Object.entries(expl)
      .map(([k, v]) => {
        const t = typeof v === "string" ? v.trim() : "";
        if (!t) return "";
        return `<li><span class="font-mono text-sm text-gray-600">${esc(k)}</span>: ${esc(t)}</li>`;
      })
      .filter(Boolean);
    if (lines.length) {
      explBlock = `<div class="mt-4"><h3 class="text-sm font-semibold text-gray-900 mb-2">Flow notes</h3><ul class="list-none pl-0 space-y-2 text-sm text-gray-700">${lines.join("\n")}</ul></div>`;
    }
  }
  return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="Diagnostic flow">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Diagnostic flow</h2>
  ${
    nodeRows.length
      ? `<div class="overflow-x-auto mb-4"><table class="w-full text-sm"><thead><tr class="text-left text-gray-600 border-b"><th class="pb-2">ID</th><th class="pb-2">Kind</th><th class="pb-2">Label</th></tr></thead><tbody>${nodeRows.join("")}</tbody></table></div>`
      : ""
  }
  ${edgeRows.length ? `<ul class="list-disc pl-5 text-sm text-gray-800 space-y-1">${edgeRows.join("")}</ul>` : ""}
  ${explBlock}
</section>`;
}

export function renderTopCauses(data: Record<string, unknown>): string {
  const raw = data.top_causes;
  if (!Array.isArray(raw) || !raw.length) return "";
  const cards = raw
    .map((c) => asRecord(c))
    .filter(Boolean)
    .map((c) => {
      const cause = asString(c!.cause);
      const why = asString(c!.why_it_happens);
      const risk = asString(c!.risk);
      const fx = asString(c!.fix_complexity);
      if (!cause) return "";
      return `<div class="rounded-lg border border-gray-200 p-4 space-y-2">
  <h3 class="font-semibold text-gray-900">${esc(cause)}</h3>
  ${why ? `<p class="text-sm text-gray-700">${esc(why)}</p>` : ""}
  ${risk ? `<p class="text-sm text-red-900"><span class="font-semibold">Risk:</span> ${esc(risk)}</p>` : ""}
  ${fx ? `<p class="text-xs uppercase tracking-wide text-gray-500">Fix complexity: ${esc(fx)}</p>` : ""}
</div>`;
    })
    .filter(Boolean);
  if (!cards.length) return "";
  return `<section class="rounded-xl border border-gray-200 bg-slate-50 p-6 mb-8" aria-label="Top causes">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Top causes</h2>
  <div class="space-y-4">${cards.join("\n")}</div>
</section>`;
}

export function renderRepairMatrix(data: Record<string, unknown>): string {
  const rows = safeArray<unknown>(data.repair_matrix, []);
  if (!rows.length) return "";

  const objectRows = rows
    .map((r) => asRecord(r))
    .filter(
      (r): r is Record<string, unknown> =>
        r != null &&
        (asString(r.symptom).length > 0 ||
          asString(r.cause ?? r.likely_issue).length > 0 ||
          asString(r.fix ?? r.fix_type).length > 0 ||
          repairMatrixCostCell(r).length > 0)
    );

  if (objectRows.length > 0) {
    const body = objectRows
      .map((r) => {
        const symptom = esc(asString(r.symptom));
        const cause = esc(asString(r.cause ?? r.likely_issue));
        const fix = esc(asString(r.fix ?? r.fix_type));
        const cost = esc(repairMatrixCostCell(r));
        return `<tr class="border-b border-gray-100 align-top">
    <td class="py-3 pr-4 text-sm text-gray-900">${symptom || "—"}</td>
    <td class="py-3 pr-4 text-sm text-gray-800">${cause || "—"}</td>
    <td class="py-3 pr-4 text-sm text-gray-800">${fix || "—"}</td>
    <td class="py-3 text-sm font-medium text-gray-900 whitespace-nowrap">${cost || "—"}</td>
  </tr>`;
      })
      .join("\n");
    return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="Repair matrix">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Repair cost breakdown</h2>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[36rem] text-left text-sm border-collapse">
      <thead>
        <tr class="border-b border-gray-200 text-gray-600">
          <th class="pb-3 pr-4 font-semibold">Symptom</th>
          <th class="pb-3 pr-4 font-semibold">Cause</th>
          <th class="pb-3 pr-4 font-semibold">Fix</th>
          <th class="pb-3 font-semibold">Cost</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>
</section>`;
  }

  const lines = repairMatrixToDisplayStrings(rows);
  if (!lines.length) return "";
  return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="Repair matrix">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Repair matrix</h2>
  <ul class="space-y-2 list-disc pl-5 text-gray-800">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
</section>`;
}

export function renderCostLadder(data: Record<string, unknown>): string {
  const raw = data.cost_ladder;
  if (!Array.isArray(raw) || !raw.length) return "";
  const rows = raw
    .map((r) => asRecord(r))
    .filter(Boolean)
    .map((r) => {
      const stage = asString(r!.stage);
      const cost = asString(r!.typical_cost);
      if (!stage && !cost) return "";
      return `<li class="flex flex-wrap gap-2 justify-between border-b border-gray-100 py-2"><span class="font-medium text-gray-900">${esc(stage)}</span><span class="text-gray-700">${esc(cost)}</span></li>`;
    })
    .filter(Boolean);
  if (!rows.length) return "";
  return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="Cost ladder">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Cost ladder</h2>
  <ul class="list-none pl-0">${rows.join("\n")}</ul>
</section>`;
}

export function renderHowSystemWorks(data: Record<string, unknown>): string {
  const t = asString(data.how_system_works);
  if (!t) return "";
  return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="How the system works">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">How the system works</h2>
  <p class="text-gray-800 leading-relaxed whitespace-pre-line">${esc(t)}</p>
</section>`;
}

export function renderTools(data: Record<string, unknown>): string {
  const tr = asRecord(data.tools_required);
  if (!tr) return "";
  const ho = asStringArray(tr.homeowner);
  const tech = asStringArray(tr.technician);
  if (!ho.length && !tech.length) return "";
  return `<section class="rounded-xl border border-gray-200 bg-gray-900 text-gray-100 p-6 mb-8" aria-label="Tools">
  <h2 class="text-lg font-semibold mb-3">Tools</h2>
  ${
    ho.length
      ? `<div class="mb-4"><h3 class="text-sm font-semibold text-green-300 mb-2">Homeowner</h3><ul class="list-disc pl-5 text-sm text-gray-200 space-y-1">${ho.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
      : ""
  }
  ${
    tech.length
      ? `<div><h3 class="text-sm font-semibold text-amber-200 mb-2">Technician</h3><ul class="list-disc pl-5 text-sm text-gray-200 space-y-1">${tech.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
      : ""
  }
</section>`;
}

export function renderRepairReplace(data: Record<string, unknown>): string {
  const rvr = asRecord(data.repair_vs_replace);
  if (!rvr) return "";
  const rep = asStringArray(rvr.repair_if);
  const repl = asStringArray(rvr.replace_if);
  if (!rep.length && !repl.length) return "";
  return `<section class="rounded-xl border border-gray-200 bg-white p-6 mb-8" aria-label="Repair vs replace">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Repair vs replace</h2>
  ${
    rep.length
      ? `<div class="mb-4"><h3 class="text-sm font-semibold text-green-800 mb-2">Repair if</h3><ul class="list-disc pl-5 text-gray-800 space-y-1">${rep.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`
      : ""
  }
  ${
    repl.length
      ? `<div><h3 class="text-sm font-semibold text-red-900 mb-2">Replace if</h3><ul class="list-disc pl-5 text-gray-800 space-y-1">${repl.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`
      : ""
  }
</section>`;
}

export function renderLocalContext(data: Record<string, unknown>): string {
  const loc = asString(data.local_context);
  const field = asString(data.field_insight);
  const pressure = asString(data.cost_pressure);
  const moment = asString(data.decision_moment);
  const maint = Array.isArray(data.maintenance) ? asStringArray(data.maintenance) : [];
  if (!loc && !field && !pressure && !moment && !maint.length) return "";
  const maintHtml = maint.length
    ? `<div class="mt-4"><h3 class="text-sm font-semibold text-gray-900 mb-2">Maintenance</h3><ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">${maint.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`
    : "";
  return `<section class="rounded-xl border border-slate-200 bg-slate-50 p-6 mb-8" aria-label="Local and field context">
  <h2 class="text-lg font-semibold text-gray-900 mb-3">Context</h2>
  ${loc ? `<p class="text-gray-800 mb-3 leading-relaxed whitespace-pre-line"><span class="font-semibold">Local:</span> ${esc(loc)}</p>` : ""}
  ${field ? `<p class="text-gray-800 mb-3 leading-relaxed whitespace-pre-line"><span class="font-semibold">Field insight:</span> ${esc(field)}</p>` : ""}
  ${pressure ? `<p class="text-gray-800 mb-3 leading-relaxed whitespace-pre-line"><span class="font-semibold">Cost pressure:</span> ${esc(pressure)}</p>` : ""}
  ${moment ? `<p class="text-gray-900 font-medium leading-relaxed whitespace-pre-line">${esc(moment)}</p>` : ""}
  ${maintHtml}
</section>`;
}

export function renderCTA(data: Record<string, unknown>): string {
  const a = asString(data.cta_primary);
  const b = asString(data.cta_secondary);
  const legacy = asString(data.cta);
  if (!a && !b && !legacy) return "";
  if (legacy && !a && !b) {
    const lines = legacy.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const head = esc(lines[0] || legacy);
    const rest = lines.slice(1).join("\n\n");
    const restHtml = rest ? `<p class="mb-4 text-blue-100 text-sm max-w-xl mx-auto whitespace-pre-line leading-relaxed">${esc(rest)}</p>` : "";
    return `<section class="rounded-xl border border-blue-700 bg-blue-600 text-white p-6 text-center mb-8" aria-label="Call to action">
  <p class="text-lg font-semibold mb-2 leading-snug">${head}</p>
  ${restHtml}
  <button type="button" class="bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors" onclick="try{window.dispatchEvent(new CustomEvent('open-leadcard'))}catch(e){}">Get Help Now</button>
</section>`;
  }
  return `<section class="rounded-xl border border-blue-700 bg-blue-600 text-white p-6 text-center mb-8" aria-label="Call to action">
  ${a ? `<p class="text-lg font-semibold mb-2 leading-snug">${esc(a)}</p>` : ""}
  ${b ? `<p class="mb-4 text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">${esc(b)}</p>` : ""}
  <button type="button" class="bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors" onclick="try{window.dispatchEvent(new CustomEvent('open-leadcard'))}catch(e){}">Get Help Now</button>
  <p class="mt-3 text-sm text-blue-100"><a class="underline font-semibold text-white hover:text-blue-50" href="/request-service">Open request form</a></p>
</section>`;
}

export function renderStopDIY(data: Record<string, unknown>): string {
  const one = asString(data.stop_diy);
  const arr = asStringArray(data.when_to_stop_diy);
  if (one) {
    return `<section class="rounded-xl border border-red-200 bg-red-50 p-6 mb-8" aria-label="Stop DIY">
  <h2 class="text-lg font-semibold text-red-950 mb-2">Stop DIY</h2>
  <p class="text-red-900 leading-relaxed whitespace-pre-line">${esc(one)}</p>
</section>`;
  }
  if (!arr.length) return "";
  return `<section class="rounded-xl border border-red-200 bg-red-50 p-6 mb-8" aria-label="When to stop DIY">
  <h2 class="text-lg font-semibold text-red-950 mb-2">When to call a technician</h2>
  <ul class="list-disc pl-5 text-red-900 space-y-2">${arr.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
</section>`;
}

export function renderStrictEngineV3ArticleHtml(data: Record<string, unknown>): string {
  const title = asString(data.title) || asString(data.h1) || "Diagnostic";
  const inner = [
    `<header class="mb-10"><h1 class="text-3xl font-bold text-gray-900">${esc(title)}</h1>`,
    asString(data.slug) ? `<p class="text-sm text-gray-500 mt-2 font-mono">${esc(asString(data.slug))}</p>` : "",
    `</header>`,
    renderHero(data),
    renderSummary(data),
    renderQuickChecks(data),
    renderDecisionFork(data),
    renderDiagnosticFlow(data),
    renderTopCauses(data),
    renderRepairMatrix(data),
    renderCostLadder(data),
    renderHowSystemWorks(data),
    renderTools(data),
    renderRepairReplace(data),
    renderLocalContext(data),
    renderCTA(data),
    renderStopDIY(data),
  ].join("\n");
  return `<article data-dg-authority-v3="1" data-diagnostic-engine-strict="1" class="dg-authority-v3-static bg-gray-50 max-w-4xl mx-auto px-4 py-10 space-y-2">${inner}</article>`;
}
