/**
 * Condition Page Template — Full authority layout for /conditions/* pages.
 * Matches /diagnose/* depth. Locked section order.
 * Uses hard fallbacks for arrays; no Mermaid dependency.
 */

import Link from "next/link";
import ConditionFastAnswer from "@/components/ConditionFastAnswer";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";

export type ConditionPageData = {
  title: string;
  summary: string;
  fastAnswer: {
    headline: string;
    body: string;
    severity: "low" | "medium" | "high";
    timeSensitivity: "monitor" | "soon" | "urgent";
  };
  thirtySecondSummary: {
    whatItUsuallyMeans: string;
    mostLikelyFix: string;
    diyPotential: string;
    callProWhen: string;
  };
  whatThisMeans: {
    headline: string;
    body: string;
    technicalNote: string;
  };
  primaryCauses: {
    name: string;
    slug: string;
    likelihood: string;
    whyItCausesThis: string;
    confirmSignals: string[];
  }[];
  diagnosticFlowMermaid: string;
  symptomsYoullNotice: string[];
  howToConfirm: {
    step: number;
    action: string;
    goodResult: string;
    badResult: string;
    safety: string;
  }[];
  repairOptions: {
    repair: string;
    slug: string;
    diyLevel: string;
    typicalUseCase: string;
    notes: string;
  }[];
  costSnapshot: {
    diyRange: string;
    proRange: string;
    majorRepairRange: string;
    costNote: string;
  };
  ifIgnored: {
    shortTerm: string;
    mediumTerm: string;
    worstCase: string;
  };
  toolsAndParts: {
    tools: string[];
    parts: string[];
  };
  technicianInsight: {
    headline: string;
    body: string;
  };
  commonMisdiagnoses: string[];
  preventionTips: string[];
  whenToCall: {
    now: string[];
    soon: string[];
    canMonitor: string[];
  };
  relatedDiagnoseGuides: { title: string; slug: string }[];
  relatedProblems: { title: string; slug: string }[];
  repairLinks: { title: string; slug: string }[];
  faq: { question: string; answer: string }[];
  cta: {
    headline: string;
    body: string;
    buttonText: string;
  };
};

export default function ConditionPageTemplate({ page }: { page: ConditionPageData }) {
  if (!page) {
    return <div>Page failed to load</div>;
  }

  // @ts-ignore
  console.log("Rendered condition page:", page.slug);

  const pageSafe = {
    primaryCauses: [],
    repairOptions: [],
    symptomsYoullNotice: [],
    howToConfirm: [],
    faq: [],
    relatedDiagnoseGuides: [],
    relatedProblems: [],
    repairLinks: [],
    ...(page as Partial<ConditionPageData>)
  } as ConditionPageData;

  const primaryCauses = pageSafe.primaryCauses ?? [];
  const repairOptions = pageSafe.repairOptions ?? [];
  const faq = pageSafe.faq ?? [];
  const relatedDiagnoseGuides = pageSafe.relatedDiagnoseGuides ?? [];
  const relatedProblems = pageSafe.relatedProblems ?? [];
  const repairLinks = pageSafe.repairLinks ?? [];
  const howToConfirm = pageSafe.howToConfirm ?? [];
  const diagnosticSteps = (pageSafe as { diagnosticSteps?: { step?: number; action?: string }[] }).diagnosticSteps ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Condition Guide</p>
        <h1 className="text-3xl font-bold tracking-tight text-hvac-navy dark:text-white">{pageSafe.title}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-3xl">{pageSafe.summary}</p>
      </header>

      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <img src="/images/hvac-default.jpg" alt={pageSafe.title} className="w-full h-64 object-cover" />
      </div>

      {pageSafe.fastAnswer && (
      <section className="mb-6">
        <ConditionFastAnswer
          title={pageSafe.fastAnswer.headline}
          body={pageSafe.fastAnswer.body}
          severity={pageSafe.fastAnswer.severity}
          timeSensitivity={pageSafe.fastAnswer.timeSensitivity}
        />
      </section>
      )}

      {pageSafe.thirtySecondSummary && (
      <section className="mb-6">
        <ThirtySecondSummary
          items={[
            { label: "Usually Means", value: pageSafe.thirtySecondSummary.whatItUsuallyMeans },
            { label: "Likely Fix", value: pageSafe.thirtySecondSummary.mostLikelyFix },
            { label: "DIY Potential", value: pageSafe.thirtySecondSummary.diyPotential },
            { label: "Call Pro When", value: pageSafe.thirtySecondSummary.callProWhen },
          ]}
        />
      </section>
      )}

      {pageSafe.whatThisMeans && (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-2">{pageSafe.whatThisMeans.headline}</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-3">{pageSafe.whatThisMeans.body}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{pageSafe.whatThisMeans.technicalNote}</p>
      </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Primary Causes</h2>
        {primaryCauses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {primaryCauses.map((cause) => (
            <article key={cause.slug} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-hvac-navy dark:text-white">{cause.name}</h3>
                <span className="text-xs rounded-full border border-slate-300 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-400">
                  {cause.likelihood}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{cause.whyItCausesThis}</p>
              <ul className="mb-3 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
                {cause.confirmSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
              <Link href={`/causes/${cause.slug}`} className="text-sm font-medium text-hvac-blue hover:underline">
                Read cause guide →
              </Link>
            </article>
          ))}
        </div>
        ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No common causes identified yet.</p>
        )}
      </section>

      {(diagnosticSteps.length > 0 || howToConfirm.length > 0) ? (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Diagnostic Flow</h2>
        <div className="space-y-4">
          {(diagnosticSteps.length > 0 ? diagnosticSteps : howToConfirm).map((step: { step?: number; action?: string }, idx: number) => (
            <div key={idx} className="flex gap-3">
              <span className="shrink-0 w-8 h-8 rounded-full bg-hvac-navy text-white flex items-center justify-center text-sm font-bold">
                {step.step ?? idx + 1}
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 pt-1">
                {step.action ?? `Step ${idx + 1}`}
              </p>
            </div>
          ))}
        </div>
      </section>
      ) : (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Diagnostic Flow</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Diagnostic flow unavailable. Review causes above.</p>
      </section>
      )}

      {pageSafe.symptomsYoullNotice?.length > 0 && (
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Symptoms You&apos;ll Notice</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {pageSafe.symptomsYoullNotice.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm text-slate-700 dark:text-slate-300">
              {item}
            </li>
          ))}
        </ul>
      </section>
      )}

      {howToConfirm.length > 0 && (
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">How to Confirm</h2>
        <div className="space-y-4">
          {howToConfirm.map((step) => (
            <article key={step.step} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="font-semibold text-hvac-navy dark:text-white mb-2">Step {step.step}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{step.action}</p>
              <p className="text-sm"><strong>Normal:</strong> {step.goodResult}</p>
              <p className="text-sm"><strong>Concerning:</strong> {step.badResult}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{step.safety}</p>
            </article>
          ))}
        </div>
      </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Repair Options</h2>
        {repairOptions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {repairOptions.map((repair) => (
            <article key={repair.slug} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="font-semibold text-hvac-navy dark:text-white mb-2">{repair.repair}</h3>
              <p className="text-xs mb-2 uppercase tracking-wide text-slate-500 dark:text-slate-400">{repair.diyLevel}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{repair.typicalUseCase}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{repair.notes}</p>
              <Link href={`/fix/${repair.slug}`} className="text-sm font-medium text-hvac-blue hover:underline">
                View repair guide →
              </Link>
            </article>
          ))}
        </div>
        ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No repair options identified yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-hvac-navy dark:text-white">Typical Costs</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-hvac-navy dark:text-white mb-2">DIY Cost</h3>
            <p className="text-slate-700 dark:text-slate-300">{pageSafe.costSnapshot?.diyRange ?? "—"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-hvac-navy dark:text-white mb-2">Typical Pro Repair</h3>
            <p className="text-slate-700 dark:text-slate-300">{pageSafe.costSnapshot?.proRange ?? "—"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-hvac-navy dark:text-white mb-2">Major Repair</h3>
            <p className="text-slate-700 dark:text-slate-300">{pageSafe.costSnapshot?.majorRepairRange ?? "—"}</p>
          </div>
        </div>

        {pageSafe.costSnapshot?.costNote && (
          <p className="mt-4 text-sm text-slate-500">
            {pageSafe.costSnapshot.costNote}
          </p>
        )}
      </section>

      {pageSafe.ifIgnored && (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">What Happens If Ignored</h2>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p><strong>Short term:</strong> {pageSafe.ifIgnored.shortTerm}</p>
          <p><strong>Medium term:</strong> {pageSafe.ifIgnored.mediumTerm}</p>
          <p><strong>Worst case:</strong> {pageSafe.ifIgnored.worstCase}</p>
        </div>
      </section>
      )}

      {(pageSafe.toolsAndParts?.tools?.length ?? 0) > 0 || (pageSafe.toolsAndParts?.parts?.length ?? 0) > 0 ? (
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-3">Tools You May Need</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {(pageSafe.toolsAndParts.tools ?? []).map((tool) => <li key={tool}>{tool}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-3">Components or Parts</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {(pageSafe.toolsAndParts.parts ?? []).map((part) => <li key={part}>{part}</li>)}
          </ul>
        </div>
      </section>
      ) : null}

      {pageSafe.technicianInsight && (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-2">{pageSafe.technicianInsight.headline}</h2>
        <p className="text-slate-700 dark:text-slate-300">{pageSafe.technicianInsight.body}</p>
      </section>
      )}

      {((pageSafe.commonMisdiagnoses?.length ?? 0) > 0 || (pageSafe.preventionTips?.length ?? 0) > 0) && (
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-3">Common Misdiagnoses</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {(pageSafe.commonMisdiagnoses ?? []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-3">Prevention Tips</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {(pageSafe.preventionTips ?? []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>
      )}

      {pageSafe.whenToCall && (
      <section className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">When to Call a Technician</h2>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Call Now</h3>
            <ul className="list-disc pl-5 text-slate-700 dark:text-slate-300">{(pageSafe.whenToCall.now ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-amber-600 dark:text-amber-300 mb-2">Schedule Soon</h3>
            <ul className="list-disc pl-5 text-slate-700 dark:text-slate-300">{(pageSafe.whenToCall.soon ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">Can Monitor</h3>
            <ul className="list-disc pl-5 text-slate-700 dark:text-slate-300">{(pageSafe.whenToCall.canMonitor ?? []).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
      </section>
      )}

      {(relatedDiagnoseGuides.length > 0 || relatedProblems.length > 0 || repairLinks.length > 0) ? (
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-hvac-navy dark:text-white mb-3">Related Diagnose Guides</h2>
          <ul className="space-y-2 text-sm">
            {relatedDiagnoseGuides.length > 0 ? relatedDiagnoseGuides.map((item) => (
              <li key={item.slug}>
                <Link href={`/diagnose/${item.slug}`} className="text-hvac-blue hover:underline">
                  {item.title}
                </Link>
              </li>
            )) : (
              <li className="text-slate-500 dark:text-slate-400">None yet.</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-hvac-navy dark:text-white mb-3">Related Problems</h2>
          <ul className="space-y-2 text-sm">
            {relatedProblems.length > 0 ? relatedProblems.map((item) => (
              <li key={item.slug}>
                <Link href={`/conditions/${item.slug}`} className="text-hvac-blue hover:underline">
                  {item.title}
                </Link>
              </li>
            )) : (
              <li className="text-slate-500 dark:text-slate-400">None yet.</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="font-semibold text-hvac-navy dark:text-white mb-3">Repair Guides</h2>
          <ul className="space-y-2 text-sm">
            {repairLinks.length > 0 ? repairLinks.map((item) => (
              <li key={item.slug}>
                <Link href={`/fix/${item.slug}`} className="text-hvac-blue hover:underline">
                  {item.title}
                </Link>
              </li>
            )) : (
              <li className="text-slate-500 dark:text-slate-400">None yet.</li>
            )}
          </ul>
        </div>
      </section>
      ) : null}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-hvac-navy dark:text-white">Recommended Replacement Parts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a href="#" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors bg-white dark:bg-slate-800">
            <span className="font-semibold text-hvac-navy dark:text-white text-center">MERV 11 Air Filters</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check Price on Amazon</span>
          </a>
          <a href="#" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors bg-white dark:bg-slate-800">
            <span className="font-semibold text-hvac-navy dark:text-white text-center">Universal Capacitors</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check Price on Amazon</span>
          </a>
          <a href="#" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors bg-white dark:bg-slate-800">
            <span className="font-semibold text-hvac-navy dark:text-white text-center">Smart Thermostats</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check Price on Amazon</span>
          </a>
          <a href="#" className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors bg-white dark:bg-slate-800">
            <span className="font-semibold text-hvac-navy dark:text-white text-center">AC Leak Seal Kits</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Check Price on Amazon</span>
          </a>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 text-center">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-2">Need help fixing this issue?</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-4">HVAC systems can be complex and dangerous to repair yourself. Connect with top-rated local technicians.</p>
        <Link
          href="/repair"
          className="inline-block rounded-lg bg-hvac-navy px-5 py-3 text-white font-bold hover:bg-hvac-navy/90 transition-colors"
        >
          Get Local HVAC Quotes
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-hvac-navy dark:text-white mb-4">Frequently Asked Questions</h2>
        {faq.length > 0 ? (
        <div className="space-y-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <summary className="cursor-pointer font-medium text-hvac-navy dark:text-white">{item.question}</summary>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
        ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No FAQs available yet.</p>
        )}
      </section>
    </main>
  );
}
