import Link from "next/link";
// TEMP: import MermaidRenderer from "@/components/MermaidRenderer";
import { LiveElectricitySafetyNotice } from "@/components/LiveElectricitySafetyNotice";
import { DgLeadButton } from "@/components/dg/DgLeadButton";

type Summary30s = {
  most_likely_cause?: string;
  what_to_check_first?: string;
  diy_vs_pro?: string;
};

type PathRow = {
  id?: string;
  title?: string;
  simple_explanation?: string;
  technical_explanation?: string;
  how_to_confirm?: string;
  typical_cost_range?: string;
};

type CostItem = { label?: string; band?: string; notes?: string };

type TechnicianSection = {
  what_they_measure?: string[];
  how_they_decide?: string;
  authority_note?: string;
};

type CostsBlock = {
  local_context_note?: string;
  items?: CostItem[];
};

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

function sanitizeMermaid(src: string): string {
  return src
    .replace(/^\s*```mermaid\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function safeDomId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || "path";
}

/**
 * Locked Tailwind layout for `layout: "dg_authority_v3"` JSON (DecisionGrid diagnostic).
 */
export function DgAuthorityV3View({
  data,
  pageTitle,
  localLabel,
}: {
  data: Record<string, unknown>;
  pageTitle: string;
  /** e.g. "Tampa, FL" — used in cost section heading */
  localLabel?: string | null;
}) {
  const summary = asRecord(data.summary_30s) as Summary30s | null;
  const mostLikely = asString(summary?.most_likely_cause);
  const checkFirst = asString(summary?.what_to_check_first);
  const diyVsPro = asString(summary?.diy_vs_pro);

  const quickChecks = asStringArray(data.quick_checks);

  const mermaidRaw = asString(data.decision_tree_mermaid);
  const mermaid = mermaidRaw ? sanitizeMermaid(mermaidRaw) : "";

  const pathsRaw = Array.isArray(data.paths) ? data.paths : [];
  const paths: PathRow[] = pathsRaw
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

  const tech = asRecord(data.technician_section) as TechnicianSection | null;
  const measures = asStringArray(tech?.what_they_measure);
  const howDecide = asString(tech?.how_they_decide);
  const authorityNote = asString(tech?.authority_note);

  const costs = asRecord(data.costs) as CostsBlock | null;
  const costNote = asString(costs?.local_context_note);
  const costItems = Array.isArray(costs?.items)
    ? (costs!.items as unknown[])
        .map((row) => asRecord(row))
        .filter(Boolean)
        .map((r) => ({
          label: asString(r!.label),
          band: asString(r!.band),
          notes: asString(r!.notes),
        }))
        .filter((r) => r.label || r.band)
    : [];

  const stopDiy = asStringArray(data.when_to_stop_diy);
  const cta = asString(data.cta);

  const relatedFromJson = (() => {
    const r = data.related_links;
    if (!Array.isArray(r)) return [];
    return r.filter(
      (x): x is string =>
        typeof x === "string" &&
        x.trim().startsWith("/") &&
        !x.includes("//") &&
        !x.toLowerCase().includes("javascript:")
    );
  })();

  const costHeadingPlace = (localLabel && localLabel.trim()) || "Your area";

  const h1 = pageTitle.trim() || "HVAC diagnostic";

  return (
    <div className="bg-gray-50 min-h-[50vh]">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* 30-second summary — hero */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">{h1}</h1>

          {mostLikely ? (
            <p className="text-gray-800 mb-3">
              <span className="font-semibold">Most common cause:</span> {mostLikely}
            </p>
          ) : null}

          {checkFirst ? (
            <p className="text-gray-800 mb-3">
              <span className="font-semibold">What to check first:</span> {checkFirst}
            </p>
          ) : null}

          {diyVsPro ? (
            <p className="text-gray-700 mb-3 text-sm leading-relaxed">
              <span className="font-semibold">DIY vs pro:</span> {diyVsPro}
            </p>
          ) : null}
        </div>

        {quickChecks.length === 0 ? <LiveElectricitySafetyNotice /> : null}

        {/* Decision tree */}
        {mermaid ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Here: Find Your Situation</h2>

            <div className="overflow-x-auto">
              {/* TEMP: <MermaidRenderer chart={mermaid} /> */}
            </div>

            <p className="text-sm text-gray-600 mt-4">
              Follow the path that matches your symptoms, then scroll to the matching section below.
            </p>
          </div>
        ) : null}

        {/* Quick checks */}
        {quickChecks.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Checks (2–5 minutes)</h3>

            <ul className="space-y-2 text-gray-700">
              {quickChecks.map((line, i) => (
                <li key={i}>
                  <span className="text-green-700 mr-1">✔</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {quickChecks.length > 0 ? <LiveElectricitySafetyNotice /> : null}

        {/* Path sections */}
        {paths.map((path, idx) => {
          const anchor = safeDomId(path.id || `path-${idx}`);
          const heading = path.title || path.id?.replace(/-/g, " ") || "Diagnostic path";
          return (
            <div
              key={path.id || String(idx)}
              id={anchor}
              className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 scroll-mt-24"
            >
              <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>

              {path.simple_explanation ? (
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{path.simple_explanation}</p>
              ) : null}

              {path.how_to_confirm ? (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">How to confirm:</span> {path.how_to_confirm}
                </p>
              ) : null}

              {path.typical_cost_range ? (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Typical cost range:</span> {path.typical_cost_range}
                </p>
              ) : null}

              {path.technical_explanation ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    <span className="font-semibold">Technical:</span> {path.technical_explanation}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}

        {/* Technician — authority */}
        {(measures.length > 0 || howDecide || authorityNote) && (
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-3">What a Technician Will Check</h3>

            {measures.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-200 mb-4">
                {measures.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            ) : null}

            {howDecide ? (
              <p className="text-sm text-gray-300 leading-relaxed mb-3 whitespace-pre-line">{howDecide}</p>
            ) : null}

            {authorityNote ? (
              <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line border-t border-gray-700 pt-3">
                {authorityNote}
              </p>
            ) : null}
          </div>
        )}

        {/* Costs */}
        {(costNote || costItems.length > 0) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Typical Repair Costs ({costHeadingPlace})
            </h3>

            {costNote ? <p className="text-sm text-gray-600 mb-4">{costNote}</p> : null}

            <div className="space-y-3 text-gray-700">
              {costItems.map((row, i) => (
                <p key={i}>
                  {row.label ? <span className="font-semibold">{row.label}:</span> : null}{" "}
                  {row.band ? <span>{row.band}</span> : null}
                  {row.notes ? (
                    <span className="text-sm text-gray-600 block mt-0.5">{row.notes}</span>
                  ) : null}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* When to stop DIY */}
        {stopDiy.length > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Call a Technician</h3>

            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {stopDiy.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* CTA */}
        {cta ? (
          <div className="bg-blue-600 text-white rounded-xl p-6 text-center border border-blue-700">
            {(() => {
              const lines = cta
                .split(/\n+/)
                .map((s) => s.trim())
                .filter(Boolean);
              const head = lines[0] || cta;
              const rest = lines.slice(1).join("\n\n");
              return (
                <>
                  <p className="text-lg font-semibold mb-2 leading-snug">{head}</p>
                  {rest ? (
                    <p className="mb-4 text-blue-100 text-sm max-w-xl mx-auto whitespace-pre-line leading-relaxed">
                      {rest}
                    </p>
                  ) : (
                    <p className="mb-4 text-blue-100 text-sm max-w-xl mx-auto">
                      A licensed HVAC technician can confirm airflow, electrical, and refrigerant-related issues
                      safely.
                    </p>
                  )}
                </>
              );
            })()}

            <DgLeadButton className="bg-white text-blue-600 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Get Help Now
            </DgLeadButton>
            <p className="mt-3 text-sm text-blue-100">
              <Link href="/request-service" className="underline font-semibold hover:text-white">
                Open request form (same lead flow, no popup)
              </Link>
            </p>
          </div>
        ) : null}

        {relatedFromJson.length > 0 ? (
          <section className="border-t border-gray-200 pt-8" aria-label="Related guides">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Related guides</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {relatedFromJson.map((href) => {
                const label = href.replace(/^\//, "").replace(/\//g, " · ");
                return (
                  <li key={href}>
                    <a className="text-blue-700 underline hover:text-blue-900" href={href}>
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
