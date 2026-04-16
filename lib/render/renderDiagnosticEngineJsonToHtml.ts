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

function safeDomId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "path";
}

function sanitizeMermaid(src: string): string {
  return src
    .replace(/^\s*```mermaid\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function relatedLinksFromJson(content: Record<string, unknown>): string[] {
  const raw = content.related_links;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is string =>
      typeof x === "string" &&
      x.trim().startsWith("/") &&
      !x.includes("//") &&
      !x.toLowerCase().includes("javascript:")
  );
}

function isDgLayout(content: Record<string, unknown>): boolean {
  return content.layout === "dg_authority_v3" || content.schemaVersion === "dg_authority_v3";
}

/**
 * Server-side HTML for crawlers and no-JS clients. Mirrors `DgAuthorityV3View` Tailwind blocks.
 * Root: `<article data-dg-authority-v3="1" …>` so `DiagnosticPageView` prefers this over React.
 */
export function renderDiagnosticEngineJsonToHtml(content: Record<string, unknown>): string {
  if (!isDgLayout(content)) {
    return `<article class="max-w-4xl mx-auto px-4 py-10 text-gray-600" data-diagnostic-fallback="1"><p>Unsupported diagnostic JSON layout for static HTML render.</p></article>`;
  }

  const esc = escapeHtml;
  const pageTitle =
    asString(content.title) || asString(content.h1) || "HVAC diagnostic";
  const localLabel = asString(content.city);

  const summary = asRecord(content.summary_30s);
  const mostLikely = summary ? asString(summary.most_likely_cause) : "";
  const checkFirst = summary ? asString(summary.what_to_check_first) : "";
  const diyVsPro = summary ? asString(summary.diy_vs_pro) : "";

  const quickChecks = asStringArray(content.quick_checks);
  const heroPreview = quickChecks.slice(0, 3);

  const mermaidRaw = asString(content.decision_tree_mermaid);
  const mermaid = mermaidRaw ? sanitizeMermaid(mermaidRaw) : "";

  const pathsRaw = Array.isArray(content.paths) ? content.paths : [];
  const paths = pathsRaw
    .map((p) => asRecord(p))
    .filter(Boolean)
    .map((p) => ({
      id: asString(p!.id),
      title: asString(p!.title),
      simple_explanation: asString(p!.simple_explanation),
      technical_explanation: asString(p!.technical_explanation),
      how_to_confirm: asString(p!.how_to_confirm),
      typical_cost_range: asString(p!.typical_cost_range),
    }))
    .filter((p) => p.id || p.title);

  const tech = asRecord(content.technician_section);
  const measures = tech ? asStringArray(tech.what_they_measure) : [];
  const howDecide = tech ? asString(tech.how_they_decide) : "";
  const authorityNote = tech ? asString(tech.authority_note) : "";

  const costs = asRecord(content.costs);
  const costNote = costs ? asString(costs.local_context_note) : "";
  const costItems =
    costs && Array.isArray(costs.items)
      ? (costs.items as unknown[])
          .map((row) => asRecord(row))
          .filter(Boolean)
          .map((r) => ({
            label: asString(r!.label),
            band: asString(r!.band),
            notes: asString(r!.notes),
          }))
          .filter((r) => r.label || r.band)
      : [];

  const stopDiy = asStringArray(content.when_to_stop_diy);
  const cta = asString(content.cta);

  const costHeadingPlace = localLabel || "Your area";

  const related = relatedLinksFromJson(content);

  const heroBullets =
    heroPreview.length > 0
      ? `<ul class="list-disc pl-5 text-gray-700 space-y-1">${heroPreview
          .map((line) => `<li>${esc(line)}</li>`)
          .join("")}</ul>`
      : "";

  const mermaidBlock = mermaid
    ? `<div class="bg-white border border-gray-200 rounded-xl p-6">
  <h2 class="text-xl font-semibold text-gray-900 mb-4">Start Here: Find Your Situation</h2>
  <div class="overflow-x-auto">
    <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-slate-50 border border-gray-200 rounded-lg p-4">${esc(mermaid)}</pre>
  </div>
  <p class="text-sm text-gray-600 mt-4">Follow the path that matches your symptoms, then jump to the matching section below. With JavaScript enabled, an interactive diagram may also display.</p>
</div>`
    : "";

  const quickBlock =
    quickChecks.length > 0
      ? `<div class="bg-green-50 border border-green-200 rounded-xl p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-3">Quick Checks (2–5 minutes)</h3>
  <ul class="space-y-2 text-gray-700">
    ${quickChecks
      .map((line) => `<li><span class="text-green-700 mr-1">✔</span>${esc(line)}</li>`)
      .join("")}
  </ul>
</div>`
      : "";

  const pathBlocks = paths
    .map((path, idx) => {
      const anchor = esc(safeDomId(path.id || `path-${idx}`));
      const heading = esc(
        path.title || (path.id ? path.id.replace(/-/g, " ") : "Diagnostic path")
      );
      const parts: string[] = [];
      parts.push(`<div id="${anchor}" class="bg-white border border-gray-200 rounded-xl p-6 space-y-4 scroll-mt-24">`);
      parts.push(`<h3 class="text-lg font-semibold text-gray-900">${heading}</h3>`);
      if (path.simple_explanation) {
        parts.push(
          `<p class="text-gray-800 leading-relaxed whitespace-pre-line">${esc(path.simple_explanation)}</p>`
        );
      }
      if (path.how_to_confirm) {
        parts.push(
          `<p class="text-sm text-gray-700"><span class="font-semibold">How to confirm:</span> ${esc(path.how_to_confirm)}</p>`
        );
      }
      if (path.typical_cost_range) {
        parts.push(
          `<p class="text-sm text-gray-700"><span class="font-semibold">Typical cost range:</span> ${esc(path.typical_cost_range)}</p>`
        );
      }
      if (path.technical_explanation) {
        parts.push(`<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
  <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line"><span class="font-semibold">Technical:</span> ${esc(path.technical_explanation)}</p>
</div>`);
      }
      parts.push(`</div>`);
      return parts.join("\n");
    })
    .join("\n");

  const techBlock =
    measures.length > 0 || howDecide || authorityNote
      ? `<div class="bg-gray-900 text-gray-100 rounded-xl p-6 border border-gray-800">
  <h3 class="text-lg font-semibold mb-3">What a Technician Will Check</h3>
  ${
    measures.length
      ? `<ul class="space-y-2 text-sm text-gray-200 mb-4">${measures.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`
      : ""
  }
  ${howDecide ? `<p class="text-sm text-gray-300 leading-relaxed mb-3 whitespace-pre-line">${esc(howDecide)}</p>` : ""}
  ${
    authorityNote
      ? `<p class="text-xs text-gray-400 leading-relaxed whitespace-pre-line border-t border-gray-700 pt-3">${esc(authorityNote)}</p>`
      : ""
  }
</div>`
      : "";

  const costBlock =
    costNote || costItems.length > 0
      ? `<div class="bg-white border border-gray-200 rounded-xl p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Typical Repair Costs (${esc(costHeadingPlace)})</h3>
  ${costNote ? `<p class="text-sm text-gray-600 mb-4">${esc(costNote)}</p>` : ""}
  <div class="space-y-3 text-gray-700">
    ${costItems
      .map((row) => {
        const bits: string[] = ["<p>"];
        if (row.label) bits.push(`<span class="font-semibold">${esc(row.label)}:</span> `);
        if (row.band) bits.push(`<span>${esc(row.band)}</span>`);
        if (row.notes) bits.push(`<span class="text-sm text-gray-600 block mt-0.5">${esc(row.notes)}</span>`);
        bits.push("</p>");
        return bits.join("");
      })
      .join("")}
  </div>
</div>`
      : "";

  const stopBlock =
    stopDiy.length > 0
      ? `<div class="bg-red-50 border border-red-200 rounded-xl p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-3">When to Call a Technician</h3>
  <ul class="list-disc pl-5 space-y-2 text-gray-700">${stopDiy.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
</div>`
      : "";

  let ctaBlock = "";
  if (cta) {
    const lines = cta
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const head = esc(lines[0] || cta);
    const rest = lines.slice(1).join("\n\n");
    const restHtml = rest
      ? `<p class="mb-4 text-blue-100 text-sm max-w-xl mx-auto whitespace-pre-line leading-relaxed">${esc(rest)}</p>`
      : `<p class="mb-4 text-blue-100 text-sm max-w-xl mx-auto">A licensed HVAC technician can confirm airflow, electrical, and refrigerant-related issues safely.</p>`;
    ctaBlock = `<div class="bg-blue-600 text-white rounded-xl p-6 text-center border border-blue-700">
  <p class="text-lg font-semibold mb-2 leading-snug">${head}</p>
  ${restHtml}
  <button type="button" class="bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors" onclick="try{window.dispatchEvent(new CustomEvent('open-leadcard'))}catch(e){}">Get Help Now</button>
  <p class="mt-3 text-sm text-blue-100"><a class="underline font-semibold text-white hover:text-blue-50" href="/request-service">Open request form (same lead flow)</a></p>
</div>`;
  }

  const relatedBlock =
    related.length > 0
      ? `<section class="max-w-4xl mx-auto px-4 pb-4" aria-label="Related guides">
  <h3 class="text-lg font-semibold text-gray-900 mb-3">Related guides</h3>
  <ul class="list-disc pl-5 text-gray-700 space-y-1">
    ${related
      .map((href) => {
        const label = href.replace(/^\//, "").replace(/\//g, " · ");
        return `<li><a class="text-blue-700 underline hover:text-blue-900" href="${esc(href)}">${esc(label)}</a></li>`;
      })
      .join("")}
  </ul>
</section>`
      : "";

  return `<article data-dg-authority-v3="1" class="dg-authority-v3-static bg-gray-50">
<div class="max-w-4xl mx-auto px-4 py-10 space-y-10">
<div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
  <h1 class="text-2xl font-semibold text-gray-900 mb-3">${esc(pageTitle)}</h1>
  ${
    mostLikely
      ? `<p class="text-gray-800 mb-3"><span class="font-semibold">Most common cause:</span> ${esc(mostLikely)}</p>`
      : ""
  }
  ${
    checkFirst
      ? `<p class="text-gray-800 mb-3"><span class="font-semibold">What to check first:</span> ${esc(checkFirst)}</p>`
      : ""
  }
  ${
    diyVsPro
      ? `<p class="text-gray-700 mb-3 text-sm leading-relaxed"><span class="font-semibold">DIY vs pro:</span> ${esc(diyVsPro)}</p>`
      : ""
  }
  ${heroBullets}
</div>
${mermaidBlock}
${quickBlock}
${pathBlocks}
${techBlock}
${costBlock}
${stopBlock}
${ctaBlock}
</div>
${relatedBlock}
</article>`;
}
