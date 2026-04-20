import { linesFromSummary30s } from "@/lib/homeservice/isHsdCityDiagnosticJson";
import { getHsdTensionSubhead } from "@/lib/homeservice/hsdTensionSubhead";
import { getQuickDecisionTreeBranches, sectionLinksForBranch } from "@/lib/homeservice/parseQuickDecisionTree";
import { getSystemBlocksForPageSlug } from "@/lib/systemBlockResolver";
import { LiveElectricitySafetyNotice } from "@/components/LiveElectricitySafetyNotice";
import { HsdInternalSiteLinks } from "@/components/homeservice/HsdInternalSiteLinks";
import { HsdTampaRelatedHvacIssues } from "@/components/homeservice/HsdTampaRelatedHvacIssues";
import { SystemBlocks } from "@/components/SystemBlocks";

function asStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 50);
}

type Props = {
  data: Record<string, unknown>;
  /** Fallback if data.title missing */
  pageTitle: string;
  /** `pages.slug` (e.g. hvac/ac-not-turning-on/tampa-fl) — used for default decision tree. */
  storageSlug?: string;
  /** When true, internal hub links render in the page shell footer instead of here. */
  deferInternalSiteLinks?: boolean;
};

/**
 * Hero matches product spec: H1, subhead (`problem`), 30-second block (`summary_30s`),
 * primary CTA (`cta.primary`) — desktop CTA column is sticky under the site header.
 */
export function HsdCityDiagnosticView({ data, pageTitle, storageSlug = "", deferInternalSiteLinks = false }: Props) {
  const title = (typeof data.title === "string" && data.title.trim()) || pageTitle;
  const problem = String(data.problem || "").trim();
  const summaryLines = linesFromSummary30s(
    typeof data.summary_30s === "string"
      ? data.summary_30s
      : data.summary_30s != null
        ? String(data.summary_30s)
        : ""
  );
  const slug = storageSlug || String(data.slug || "");
  const pageVertical = (slug.split("/")[0] || "hvac").toLowerCase();
  const tensionSubhead = getHsdTensionSubhead(data, slug);
  const cta = (data.cta && typeof data.cta === "object" ? data.cta : {}) as Record<string, unknown>;
  const rawPrimary = typeof cta.primary === "string" ? cta.primary.trim() : "";
  const looksHvacLocked =
    /\b(hvac|compressor|refrigerant|furnace|air conditioner|heat pump)\b/i.test(rawPrimary) ||
    /^get local hvac/i.test(rawPrimary) ||
    /^book.*hvac/i.test(rawPrimary);
  const primaryCta =
    (pageVertical === "plumbing" || pageVertical === "electrical") && (!rawPrimary || looksHvacLocked)
      ? pageVertical === "plumbing"
        ? "Urgent: dispatch a licensed plumber"
        : "Urgent: dispatch a licensed electrician"
      : rawPrimary ||
        (pageVertical === "plumbing"
          ? "Urgent: dispatch a licensed plumber"
          : pageVertical === "electrical"
            ? "Urgent: dispatch a licensed electrician"
            : "Urgent: get local HVAC help");
  const secondaryCta = typeof cta.secondary === "string" ? cta.secondary.trim() : "";

  const quickChecks = asStrings(data.quick_checks);
  const likelyCauses = asStrings(data.likely_causes);
  const diagnosticSteps = asStrings(data.diagnostic_steps);
  const rvp = data.repair_vs_pro && typeof data.repair_vs_pro === "object" ? data.repair_vs_pro : null;
  const diyOk = rvp ? asStrings((rvp as Record<string, unknown>).diy_ok) : [];
  const callPro = rvp ? asStrings((rvp as Record<string, unknown>).call_pro) : [];
  const decisionBranches = getQuickDecisionTreeBranches(
    data,
    slug
  );
  const branches = decisionBranches ?? [];

  const systemBlockKeys = getSystemBlocksForPageSlug(slug);
  const showDecisionTree = branches.length > 0;

  return (
    <article className="mx-auto max-w-4xl px-4 pb-20 pt-2">
      <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-700">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-tight text-hvac-navy dark:text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 text-base font-semibold leading-snug text-slate-800 dark:text-slate-200 sm:text-lg">
              {tensionSubhead}
            </p>
            {problem && problem !== tensionSubhead ? (
              <p className="mt-2 text-sm font-medium leading-snug text-slate-600 dark:text-slate-400">{problem}</p>
            ) : null}
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
              <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                30-second summary
              </h2>
              {summaryLines.length > 1 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200 sm:text-base">
                  {summaryLines.map((line, i) => (
                    <li key={`hsd-sum-${i}`}>{line.replace(/^[•\-\*]\s*/, "")}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-base">
                  {summaryLines[0] || ""}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 lg:sticky lg:top-24 lg:w-56 xl:w-64">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  if (pageVertical === "plumbing" || pageVertical === "electrical") {
                    window.dispatchEvent(new CustomEvent("open-leadcard", { detail: { issue: "not_sure" } }));
                  } else {
                    window.dispatchEvent(new CustomEvent("open-leadcard"));
                  }
                }}
                className="w-full rounded-xl bg-hvac-navy px-4 py-3.5 text-center text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-hvac-blue focus:outline-none focus:ring-2 focus:ring-hvac-gold"
              >
                {primaryCta}
              </button>
              {secondaryCta ? (
                <p className="mt-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400">{secondaryCta}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {!quickChecks.length ? <LiveElectricitySafetyNotice className="mb-8" /> : null}

      {showDecisionTree ? (
        <>
          <section
            id="quick-decision-tree"
            className="mb-8 scroll-mt-24"
            aria-labelledby="hsd-qdt-heading"
          >
            <div className="overflow-hidden rounded-2xl border-2 border-hvac-navy bg-hvac-navy shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
              <div className="border-b border-white/15 bg-gradient-to-r from-hvac-navy to-slate-900 px-5 py-4 sm:px-6 sm:py-5">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-hvac-gold">Quick decision tree</div>
                <h2
                  id="hsd-qdt-heading"
                  className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl"
                >
                  Start here — what&apos;s happening?
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-snug text-slate-300">
                  Tap a branch to jump to its anchor, then open the guide sections that match your symptom.
                </p>
              </div>
              <ul className="divide-y divide-white/10 bg-slate-950/40">
                {branches.map((row) => (
                  <li key={row.anchor} className="p-0">
                    <a
                      href={`#${row.anchor}`}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hvac-gold sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 rounded border-2 border-white/40 bg-white/5 group-hover:border-hvac-gold/80"
                          aria-hidden
                        />
                        <span className="text-base font-bold leading-snug text-white sm:text-lg">{row.situation}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0">
                        <span className="text-hvac-gold" aria-hidden>
                          →
                        </span>
                        <span className="rounded-lg bg-hvac-gold/15 px-3 py-1.5 text-sm font-black text-hvac-gold sm:text-base">
                          {row.leads_to}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </section>

          {systemBlockKeys.length ? <SystemBlocks keys={systemBlockKeys} /> : null}

          <div className="mb-12 space-y-5">
            {branches.map((row) => (
              <section
                key={row.anchor}
                id={row.anchor}
                tabIndex={-1}
                className="scroll-mt-28 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800/50"
                aria-labelledby={`${row.anchor}-h`}
              >
                <h3
                  id={`${row.anchor}-h`}
                  className="text-lg font-black tracking-tight text-hvac-navy dark:text-white"
                >
                  {row.leads_to}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{row.situation}</p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Jump to guide sections
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sectionLinksForBranch(row).map((l) => (
                    <a
                      key={l.id}
                      href={`#${l.id}`}
                      className="inline-flex rounded-full border border-hvac-navy/25 bg-white px-3 py-1.5 text-xs font-bold text-hvac-navy shadow-sm transition hover:bg-hvac-navy hover:text-white dark:border-slate-500 dark:bg-slate-900 dark:text-hvac-gold dark:hover:bg-hvac-gold dark:hover:text-hvac-navy"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : systemBlockKeys.length ? (
        <SystemBlocks keys={systemBlockKeys} />
      ) : null}

      {quickChecks.length ? (
        <section id="section-quick-checks" className="mb-10 scroll-mt-28">
          <h2 className="mb-1 text-xl font-black text-hvac-navy dark:text-white">Quick checks (2–5 min)</h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            {pageVertical === "plumbing"
              ? "Fast pass — locate shutoffs, obvious leaks, and simple drain flow before water damage spreads."
              : pageVertical === "electrical"
                ? "Fast pass — confirm whole-house vs one circuit and GFCI trips before opening the panel further."
                : "Fast pass — rule out the common tripwires before you dig deeper."}
          </p>
          <ul className="space-y-2.5 text-slate-800 dark:text-slate-200">
            {quickChecks.map((item, i) => (
              <li key={`hsd-qc-${i}`} className="flex gap-2.5 text-sm font-semibold leading-snug sm:text-base">
                <span className="shrink-0 text-hvac-navy dark:text-hvac-gold" aria-hidden>
                  ✔
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quickChecks.length ? <LiveElectricitySafetyNotice className="mb-10" /> : null}

      {likelyCauses.length ? (
        <section id="section-likely-causes" className="mb-10 scroll-mt-28">
          <h2 className="mb-3 text-xl font-black text-hvac-navy dark:text-white">Likely causes</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
            {likelyCauses.map((item, i) => (
              <li key={`hsd-lc-${i}`}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {diagnosticSteps.length ? (
        <section id="section-diagnostic-steps" className="mb-10 scroll-mt-28">
          <h2 className="mb-3 text-xl font-black text-hvac-navy dark:text-white">Diagnostic steps</h2>
          <ol className="list-decimal space-y-3 pl-5 text-slate-700 dark:text-slate-300">
            {diagnosticSteps.map((item, i) => (
              <li key={`hsd-ds-${i}`} className="pl-1">
                {item}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {diyOk.length || callPro.length ? (
        <section id="section-repair-vs-pro" className="mb-10 scroll-mt-28 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-600 dark:bg-slate-800/50">
            <h3 className="mb-2 font-black text-hvac-navy dark:text-white">DIY-appropriate</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {diyOk.map((item, i) => (
                <li key={`hsd-diy-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 dark:border-red-900/40 dark:bg-red-950/20">
            <h3 className="mb-2 font-black text-red-900 dark:text-red-200">Call a pro</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-800 dark:text-slate-200">
              {callPro.map((item, i) => (
                <li key={`hsd-pro-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {!deferInternalSiteLinks ? <HsdInternalSiteLinks data={data} /> : null}
      <HsdTampaRelatedHvacIssues storageSlug={slug} />
    </article>
  );
}
