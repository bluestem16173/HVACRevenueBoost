import Link from "next/link";
import { normalizeToString } from "@/lib/utils";
import {
  getCauseTechnicalContent,
  getSystemContext,
  HIGH_DESERT_CLIMATE_FACTORS,
  AIRFLOW_PARTS,
  getEnvironmentVariations,
} from "@/lib/symptom-technical-content";

// Repair cost/difficulty mapping for authority table
const REPAIR_DISPLAY: Record<string, { difficulty: string; cost: string }> = {
  "replace-air-filter": { difficulty: "Easy", cost: "$10 – $40" },
  "clean-evaporator-coil": { difficulty: "Moderate", cost: "$250 – $600" },
  "duct-sealing": { difficulty: "Advanced", cost: "$500 – $1,100" },
  "replace-blower-motor": { difficulty: "Advanced", cost: "$500 – $1,100" },
  "replace-capacitor": { difficulty: "Moderate", cost: "$120 – $350" },
  "recharge-refrigerant": { difficulty: "Advanced", cost: "$200 – $600" },
};

function getRepairDisplay(repair: any): { difficulty: string; cost: string } {
  const slug = repair?.slug || repair?.id || "";
  return (
    REPAIR_DISPLAY[slug] || {
      difficulty:
        repair?.skill_level === "advanced"
          ? "Advanced"
          : repair?.skill_level === "moderate"
            ? "Moderate"
            : "Easy",
      cost:
        repair?.estimatedCost === "low"
          ? "$10 – $40"
          : repair?.estimatedCost === "medium"
            ? "$120 – $600"
            : "$500 – $1,100",
    }
  );
}

export default function ServicePageTemplate({
  city,
  symptom,
  causeDetails,
  diagnosticSteps,
  internalLinks,
  localContractors,
  htmlContent,
  symptomSlug,
  qualityScore = 100,
}: any) {
  const isWeakAirflow = (symptomSlug || symptom?.slug || symptom?.id || "").includes("airflow");
  const isHighDesert = ["tempe", "phoenix", "scottsdale", "mesa", "chandler", "tucson", "las-vegas", "henderson"].includes(
    city?.slug || ""
  );
  const envVariations = getEnvironmentVariations(symptomSlug || symptom?.id || "", city?.slug || "");
  const systemContext = getSystemContext(symptomSlug || symptom?.id || "");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Breadcrumbs */}
      <nav className="max-w-[1100px] mx-auto px-5 py-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-hvac-blue">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
        <span className="mx-2">/</span>
        <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
        <span className="mx-2">/</span>
        <Link href={`/diagnose/${symptomSlug || symptom?.id}`} className="hover:text-hvac-blue">
          {symptom?.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="capitalize">{(city?.slug || "").split("-").join(" ")}</span>
      </nav>

      {/* 1. Diagnostic Header */}
      <section className="diagnostic-header max-w-[900px] mx-auto px-5 py-10 text-center">
        <h1 className="text-[34px] font-bold text-hvac-navy dark:text-white mb-2.5 leading-tight">
          {symptom?.name} – {city?.name} HVAC Diagnosis
        </h1>
        <p className="diagnostic-summary text-[#555] dark:text-slate-400 text-lg leading-relaxed">
          {normalizeToString(symptom?.name).toLowerCase()} usually indicates an airflow restriction within the return system, blower
          assembly, evaporator coil, or duct network. This diagnostic guide explains the technical causes, verification
          tests, and repair options used by HVAC technicians.
        </p>
      </section>

      {/* 2. System Context Panel */}
      <section className="system-context">
        <div className="context-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1000px] mx-auto px-5 py-8">
          <div className="context-card bg-[#f8f9fb] dark:bg-slate-900 p-5 rounded-[10px] border border-slate-200 dark:border-slate-700">
            <h4 className="mb-1 text-sm text-slate-500 dark:text-slate-400">System</h4>
            <p className="font-semibold text-hvac-navy dark:text-white m-0">{systemContext.system}</p>
          </div>
          <div className="context-card bg-[#f8f9fb] dark:bg-slate-900 p-5 rounded-[10px] border border-slate-200 dark:border-slate-700">
            <h4 className="mb-1 text-sm text-slate-500 dark:text-slate-400">Component Path</h4>
            <p className="font-semibold text-hvac-navy dark:text-white m-0">{systemContext.componentPath}</p>
          </div>
          <div className="context-card bg-[#f8f9fb] dark:bg-slate-900 p-5 rounded-[10px] border border-slate-200 dark:border-slate-700">
            <h4 className="mb-1 text-sm text-slate-500 dark:text-slate-400">Symptom Type</h4>
            <p className="font-semibold text-hvac-navy dark:text-white m-0">{systemContext.symptomType}</p>
          </div>
          <div className="context-card bg-[#f8f9fb] dark:bg-slate-900 p-5 rounded-[10px] border border-slate-200 dark:border-slate-700">
            <h4 className="mb-1 text-sm text-slate-500 dark:text-slate-400">Environment</h4>
            <p className="font-semibold text-hvac-navy dark:text-white m-0">
              {isHighDesert ? "Hot Desert Climate" : "Residential HVAC"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Diagnostic Severity Card */}
      <section className="severity-section">
        <div className="severity-card flex flex-wrap justify-between gap-5 max-w-[900px] mx-auto px-6 py-6 bg-[#0f172a] text-white rounded-xl">
          <div className="severity-item text-center flex-1 min-w-[120px]">
            <h4 className="text-[13px] opacity-70 mb-1 font-medium">Cooling Loss</h4>
            <span className="font-semibold">Moderate</span>
          </div>
          <div className="severity-item text-center flex-1 min-w-[120px]">
            <h4 className="text-[13px] opacity-70 mb-1 font-medium">Efficiency Impact</h4>
            <span className="font-semibold">Reduced</span>
          </div>
          <div className="severity-item text-center flex-1 min-w-[120px]">
            <h4 className="text-[13px] opacity-70 mb-1 font-medium">Risk Level</h4>
            <span className="font-semibold">Medium</span>
          </div>
          <div className="severity-item text-center flex-1 min-w-[120px]">
            <h4 className="text-[13px] opacity-70 mb-1 font-medium">Repair Range</h4>
            <span className="font-semibold">$120 – $1,100</span>
          </div>
        </div>
      </section>

      {/* 4. Root Cause Grid */}
      <section className="cause-grid py-12">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white text-center mb-10">
          Technical Root Causes
        </h2>
        <div className="cause-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto px-5">
          {causeDetails?.map((cause: any, idx: number) => {
            const causeSlug = cause?.slug || cause?.id || "";
            const techContent = getCauseTechnicalContent(symptomSlug || symptom?.id || "", causeSlug);
            const technicalCause = techContent?.technicalCause || cause?.explanation;
            const verificationTest = techContent?.verificationTest;

            return (
              <div
                key={idx}
                className="cause-card bg-white dark:bg-slate-900 p-6 rounded-[10px] border border-slate-200 dark:border-slate-700"
              >
                <h3 className="text-lg font-bold text-hvac-navy dark:text-white mb-2.5">
                  {cause?.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0">
                  {technicalCause}
                </p>
                {verificationTest && verificationTest.length > 0 && (
                  <ul className="mt-2.5 pl-[18px] list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {verificationTest.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                )}
                {cause?.slug && (
                  <Link
                    href={`/causes/${cause.slug}`}
                    className="inline-block mt-3 text-xs font-bold text-hvac-blue hover:underline uppercase tracking-wider"
                  >
                    Full Analysis →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Technician Diagnostic Flow */}
      <section className="diagnostic-flow py-12">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white text-center mb-10">
          Technician Diagnostic Steps
        </h2>
        <div className="flow flex flex-col items-center max-w-[400px] mx-auto px-5">
          {diagnosticSteps?.slice(0, 6).map((step: any, idx: number) => (
            <div key={idx} className="w-full">
              <div className="flow-step bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-5 py-4 text-center font-semibold text-hvac-navy dark:text-white">
                {step?.step}
              </div>
              {idx < (diagnosticSteps?.length || 1) - 1 && (
                <div className="flow-arrow text-center py-2 text-2xl text-slate-400">↓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Repair Options Grid */}
      <section className="repair-grid py-12">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white text-center mb-8">
          Repair Options
        </h2>
        <div className="max-w-[900px] mx-auto px-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="p-4 text-left font-bold text-slate-700 dark:text-slate-300">Repair</th>
                <th className="p-4 text-left font-bold text-slate-700 dark:text-slate-300">Difficulty</th>
                <th className="p-4 text-left font-bold text-slate-700 dark:text-slate-300">Cost Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                const repairs = causeDetails?.flatMap((c: any) => c.repairDetails || []) || [];
                if (repairs.length === 0) {
                  return (
                    <tr>
                      <td className="p-4 text-slate-500 italic" colSpan={3}>
                        Diagnostics required for accurate repair cost.
                      </td>
                    </tr>
                  );
                }
                return repairs.map((repair: any, idx: number) => {
                  const { difficulty, cost } = getRepairDisplay(repair);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-hvac-navy dark:text-slate-200">{repair?.name}</td>
                      <td className="p-4">{difficulty}</td>
                      <td className="p-4 font-bold">{cost}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Parts / Components (Affiliate Opportunity) */}
      <section className="parts-section py-12">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white text-center mb-8">
          Parts & Components
        </h2>
        <div className="max-w-[900px] mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AIRFLOW_PARTS.map((part, idx) => (
              <Link
                key={idx}
                href={`/tools/${part.slug}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-hvac-blue transition-colors"
              >
                <span className="font-semibold text-hvac-navy dark:text-white">{part.name}</span>
                <span className="text-xs text-slate-500">View Guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Climate Conditions / Environment Variations */}
      <section className="climate-section py-12">
        <h2 className="text-2xl font-bold text-hvac-navy dark:text-white text-center mb-8">
          Climate Conditions
        </h2>
        <div className="max-w-[900px] mx-auto px-5">
          <div className="space-y-3">
            {envVariations.map((env, idx) => (
              <Link
                key={idx}
                href={`/${env.slug}`}
                className="block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-hvac-blue transition-colors capitalize"
              >
                {env.label}
              </Link>
            ))}
          </div>
          {isHighDesert && (
            <div className="mt-8 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
              <h3 className="font-bold text-hvac-navy dark:text-white mb-3">
                {city?.name} Climate Factors
              </h3>
              <ul className="list-none p-0 m-0 space-y-2">
                {HIGH_DESERT_CLIMATE_FACTORS.map((factor, idx) => (
                  <li key={idx} className="flex gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-hvac-gold">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 9. Local HVAC CTA */}
      {qualityScore >= 80 && (
        <section className="local-cta py-12">
          <div className="max-w-[900px] mx-auto px-5">
            <div className="bg-hvac-navy text-white p-10 rounded-2xl text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Need HVAC Repair in {city?.name}?
              </h2>
              <p className="text-slate-300 mb-6 leading-relaxed max-w-[600px] mx-auto">
                If airflow remains weak after replacing the air filter or inspecting vents, the issue may involve the
                blower motor, evaporator coil, or duct system.
              </p>
              <p className="text-slate-400 text-sm mb-8">
                Schedule professional HVAC service in {city?.name}.
              </p>
              <button
                data-open-lead-modal
                className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-bold px-8 py-4 rounded-xl uppercase tracking-wider transition-colors"
              >
                Get {city?.name} Repair Quotes
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Diagnostic Pathway (upward links) */}
      <section className="max-w-[900px] mx-auto px-5 py-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
          Diagnostic Pathway
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link href={`/diagnose/${symptomSlug || symptom?.id}`} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors">
            {symptom?.name} Diagnostic
          </Link>
          {causeDetails?.[0] && (
            <Link href={`/causes/${causeDetails[0].slug || causeDetails[0].id}`} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors">
              {causeDetails[0].name} Cause
            </Link>
          )}
          {causeDetails?.[0]?.repairDetails?.[0] && (
            <Link href={`/fix/${causeDetails[0].repairDetails[0].slug || causeDetails[0].repairDetails[0].id}`} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors">
              {causeDetails[0].repairDetails[0].name}
            </Link>
          )}
          <Link href="/repair" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-hvac-blue transition-colors">
            All Repair Guides
          </Link>
        </div>
      </section>

      {/* 10. Related Diagnostics */}
      {internalLinks?.length > 0 && (
        <section className="related py-16 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-center text-xl font-bold text-hvac-navy dark:text-white mb-8">
            Related Diagnostics
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-[900px] mx-auto px-5">
            {internalLinks.map((link: any, idx: number) => (
              <Link
                key={idx}
                href={`/${link.target_slug}`}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium hover:border-hvac-blue hover:bg-hvac-blue/5 transition-colors"
              >
                {link.anchor_text}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI-generated content (if present) */}
      {htmlContent && (
        <section className="max-w-[900px] mx-auto px-5 py-12">
          <h2 className="text-xl font-bold text-hvac-navy dark:text-white mb-6">
            Detailed Diagnostic Notes
          </h2>
          <div
            className="prose prose-slate max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </section>
      )}
    </div>
  );
}
