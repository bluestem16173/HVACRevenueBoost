/**
 * Repair Page Template — Structured rendering only
 * ------------------------------------------------
 * Uses pageViewModel from translator. Safe fallbacks for incomplete content.
 * No raw contentJson. No dangerouslySetInnerHTML.
 * Mermaid: client-only via MermaidDiagram component.
 * @see docs/MASTER-PROMPT-DECISIONGRID.md
 */
import Link from "next/link";
import dynamic from "next/dynamic";
import { normalizeToString } from "@/lib/utils";
import ServiceCTA from "@/components/ServiceCTA";
import { toSafeString } from "@/lib/content";
import ThirtySecondSummary from "@/components/ThirtySecondSummary";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

const DEFAULT_TOOLS = [
  { name: "Multimeter", description: "Test voltage and capacitance" },
  { name: "Capacitor discharge tool", description: "Safe discharge before handling" },
  { name: "Screwdriver set", description: "Access panels and terminals" },
];

export default function RepairPageTemplate({
  repair,
  component,
  tools,
  cause,
  pageViewModel,
}: {
  repair: { name: string; repair_type?: string; skill_level?: string };
  component: { name: string; slug: string } | null;
  tools: Array<{ name?: string; slug?: string; description?: string }>;
  cause: { name?: string; slug?: string } | null;
  pageViewModel: {
    fastAnswer?: string;
    whatThisFixes?: string;
    whenToUse?: string[];
    timeRequired?: string;
    riskLevel?: string;
    costRepair?: { diy: string; professional: string };
    toolsRequired?: Array<{ name: string; reason?: string; description?: string }>;
    partsNeeded?: Array<{ name: string; description?: string }>;
    repairFlowMermaid?: string | null;
    repairStepsOverview?: Array<{ step?: number; action: string; description?: string }>;
    whenNotToDiy?: string[];
    commonMistakes?: Array<{ name: string; description?: string; time?: string }>;
    relatedSymptoms?: string[];
    relatedCauses?: string[];
    faq?: Array<{ question: string; answer: string }>;
    technicianInsights?: Array<string | { text: string; cite?: string }>;
  };
}) {
  const vm = pageViewModel;
  const displayTools = (vm.toolsRequired?.length ?? 0) > 0
    ? vm.toolsRequired!.map((t) => ({ name: t.name, reason: t.reason ?? t.description, description: t.description ?? t.reason }))
    : tools?.length > 0
      ? tools.map((t) => ({ name: t.name, reason: t.description, description: t.description }))
      : DEFAULT_TOOLS;
  const displayParts = vm.partsNeeded ?? [];
  const displaySteps = vm.repairStepsOverview ?? [];
  const displayFastAnswer = toSafeString(vm.fastAnswer);

  const costDisplay = vm.costRepair
    ? `${vm.costRepair.diy} DIY / ${vm.costRepair.professional} Pro`
    : (repair.repair_type === "low" ? "$150 - $350" : repair.repair_type === "high" ? "$800+" : "$350 - $800");
  const summaryPoints = [
    { label: "Repair Type", value: repair.name },
    { label: "Cost Estimate", value: costDisplay },
    { label: "Target Component", value: component?.name || "System Level" },
    { label: "Skill Level", value: repair.skill_level || vm.timeRequired || "Professional Recommended" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/components/${component?.slug || ""}`} className="hover:text-hvac-blue">{component?.name || "Components"}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">How to Fix</span>
      </nav>

      <section className="mb-12">
        <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
          Technical Service Manual
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
          How to {normalizeToString(repair.name).toLowerCase()}
        </h1>
      </section>

      <ThirtySecondSummary points={summaryPoints} />

      {displayFastAnswer && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Fast Answer</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{displayFastAnswer}</p>
        </section>
      )}

      {vm.whatThisFixes && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">What This Repair Fixes</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{vm.whatThisFixes}</p>
        </section>
      )}

      {(vm.whenToUse?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">When You Should Do This Repair</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            {vm.whenToUse!.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {vm.repairFlowMermaid && (
        <section className="mb-10">
          <MermaidDiagram chart={vm.repairFlowMermaid} title="Repair Flow" />
        </section>
      )}

      {displayTools.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Tools Required</h2>
          <ul className="space-y-3 list-none p-0">
            {displayTools.map((t, i) => {
              const desc = (t as { reason?: string; description?: string }).reason ?? (t as { reason?: string; description?: string }).description;
              return (
                <li key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-hvac-navy dark:text-white">{toSafeString(t.name) ?? "Tool"}</span>
                  {desc && <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">— {desc}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {displayParts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Parts Required</h2>
          <ul className="space-y-3 list-none p-0">
            {displayParts.map((p, i) => (
              <li key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-hvac-navy dark:text-white">{p.name}</span>
                {p.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 m-0">{p.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {displaySteps.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Repair Overview</h2>
          <div className="space-y-4">
            {displaySteps.map((step, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-hvac-navy dark:text-white">Step {step.step ?? i + 1}</strong>
                <p className="text-slate-600 dark:text-slate-400 mt-2 m-0">{step.description ?? step.action}</p>
              </div>
            ))}
          </div>
          <ServiceCTA variant="primary" />
        </section>
      ) : (
        <section className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Repair Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 m-0">
            Follow manufacturer guidelines and safety procedures. When in doubt, consult a licensed professional.
          </p>
          <ServiceCTA variant="primary" />
        </section>
      )}

      {(vm.commonMistakes?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Common Mistakes</h2>
          <ul className="space-y-3 list-none p-0">
            {vm.commonMistakes!.map((m, i) => (
              <li key={i} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="font-bold text-hvac-navy dark:text-white">{m.name}</span>
                {m.description && m.description !== m.name && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 m-0">{m.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {vm.costRepair && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-3">Cost</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">DIY</span>
              <p className="text-lg font-bold text-hvac-navy dark:text-white m-0 mt-1">{vm.costRepair.diy}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Professional</span>
              <p className="text-lg font-bold text-hvac-navy dark:text-white m-0 mt-1">{vm.costRepair.professional}</p>
            </div>
          </div>
          <ServiceCTA variant="secondary" />
        </section>
      )}

      {((vm.relatedSymptoms?.length ?? 0) > 0 || (vm.relatedCauses?.length ?? 0) > 0) && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">Related</h2>
          <div className="flex flex-wrap gap-2">
            {(vm.relatedSymptoms ?? []).map((s, i) => (
              <Link key={`s-${i}`} href={`/diagnose/${s}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-hvac-blue hover:bg-slate-200 dark:hover:bg-slate-700">
                {s.replace(/-/g, " ")}
              </Link>
            ))}
            {(vm.relatedCauses ?? []).map((c, i) => (
              <Link key={`c-${i}`} href={`/cause/${c}`} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-hvac-blue hover:bg-slate-200 dark:hover:bg-slate-700">
                {c.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ServiceCTA variant="final" />

      {(vm.faq?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-hvac-navy dark:text-white mb-4">FAQ</h2>
          <div className="space-y-4">
            {vm.faq!.map((f, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-hvac-navy dark:text-white m-0 mb-2">{f.question}</h3>
                <p className="text-slate-600 dark:text-slate-400 m-0 text-sm">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-24 pt-24 border-t border-slate-200 dark:border-slate-700">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7">
            <h2 className="mt-0 text-3xl font-black border-0 leading-tight text-hvac-navy dark:text-white">Tools & Precautions</h2>
            <p className="text-hvac-safety font-bold text-sm mt-4 bg-hvac-safety/10 p-4 rounded-lg border border-hvac-safety/20">
              WARNING: Extreme risk of electrical shock. Always discharge capacitors and disconnect main breaker before proceeding.
            </p>
            {(vm.whenNotToDiy?.length ?? 0) > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-black text-hvac-navy dark:text-white uppercase tracking-widest mb-2">When Not to DIY</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {vm.whenNotToDiy!.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8">
              <h4 className="text-hvac-navy dark:text-white font-black text-xs uppercase tracking-widest mb-4">Required Tools</h4>
              <ul className="space-y-3 list-none p-0">
                {tools?.map((t, i) => (
                  <li key={t.slug ?? t.name ?? i} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <Link href={`/tools/${t.slug ?? ""}`} className="font-bold text-hvac-blue hover:underline block">{t.name ?? "Tool"}</Link>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 block">{t.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl">
              <h4 className="font-black text-hvac-navy dark:text-white text-xs uppercase tracking-widest mb-4">Primary Triggers (Why you are here)</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400 m-0">
                This manual is intended for systems suffering from <strong>{cause?.name || "a detected fault"}</strong>.
              </p>
              <Link href={`/cause/${cause?.slug}`} className="text-xs font-bold text-hvac-blue uppercase hover:underline mt-4 inline-block">Review Root Cause Analysis →</Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="bg-hvac-navy text-white p-8 rounded-2xl text-center shadow-xl">
              <h3 className="text-2xl font-black mb-4 border-0 text-white">Need Professional Installation?</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">Don&apos;t risk electrical or refrigerant hazards. Get quotes from local experts.</p>
              <button data-open-lead-modal className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md w-full">
                Get Repair Quotes
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
