/**
 * Symptom Page Template — LOCKED
 * Canonical structure. See docs/TEMPLATE-LOCKED.md and public/mockup-diagnostic-page.html
 *
 * Hardened 21-point Master Content Prompt. HVAC Revenue Boost color scheme:
 * hvac-navy (#0a192f), hvac-blue (#1e3a8a), hvac-gold (#d4af37), hvac-safety (#e53e3e)
 */
import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });
import DiyDifficultyMeter, { DiyLegalDisclaimer } from "@/components/DiyDifficultyMeter";
import { getConditionsForSymptom } from "@/lib/conditions";
import { getClusterForSymptom } from "@/lib/clusters";
import { SECTION_MAP } from "@/components/sections";
import { resolveLayout } from "@/lib/layout-resolver";

export default function SymptomPageTemplate({
  symptom,
  causeIds,
  causeDetails,
  diagnosticSteps,
  relatedContent,
  internalLinks,
  relatedLinks,
  tools,
  getCauseDetails,
  htmlContent,
  contentJson,
}: any) {
  // Resolve causes from DB or static KG
  const fullCauses = causeDetails?.length > 0
    ? causeDetails
    : (causeIds || []).map((id: string) => getCauseDetails(id)).filter(Boolean);
  const firstCause = fullCauses[0] || null;
  const cluster = getClusterForSymptom(symptom.id);

  // New contentJson structure (21-point master prompt)
  const {
    fast_answer,
    most_common_fix,
    diagnostic_checklist,
    diagnostic_tree_mermaid,
    guided_diagnosis_filters,
    causes: jsonCauses,
    repairs: jsonRepairs,
    components,
    tools_required,
    cost_estimates,
    technician_insights,
    common_mistakes,
    environment_conditions,
    prevention_tips,
    faq,
    schema_json,
  } = contentJson || {};

  // Fallbacks when new format not present
  const fastAnswerText = fast_answer ?? (firstCause
    ? `Likely caused by ${firstCause.name}. ${firstCause.explanation || ""}`
    : symptom.description);

  const causes = jsonCauses?.length > 0
    ? jsonCauses
    : fullCauses.map((c: any) => ({
        name: c.name,
        symptoms: c.explanation,
        explanation: c.explanation,
        difficulty: c.repairDetails?.[0]?.diyDifficulty === "rookie" ? "Easy" : "Moderate",
        difficultyColor: "text-hvac-blue",
        cost: c.repairDetails?.[0]?.estimatedCost === "low" ? "$50–$150" : c.repairDetails?.[0]?.estimatedCost === "medium" ? "$150–$450" : "$450+",
        repairs: (c.repairDetails || []).map((r: any) => ({
          name: r.name,
          description: r.description,
          cost: r.estimatedCost === "low" ? "$50–$150" : r.estimatedCost === "medium" ? "$150–$450" : "$450+",
          difficulty: r.diyDifficulty === "rookie" ? "Easy" : "Moderate",
          difficultyColor: "text-hvac-blue",
          link: `/fix/${r.slug || r.id}`,
          badges: {},
        })),
      }));

  const repairs = jsonRepairs ?? fullCauses.flatMap((c: any) => (c.repairDetails || []).map((r: any) => ({
    name: r.name,
    difficulty: r.diyDifficulty === "rookie" ? "Easy" : "Moderate",
    difficultyBg: r.diyDifficulty === "professional-only" ? "bg-hvac-safety" : "bg-hvac-gold",
    cost: r.estimatedCost === "low" ? "$50–$150" : r.estimatedCost === "medium" ? "$150–$450" : "$450+",
    diyText: r.diyDifficulty === "rookie" ? "Yes" : "Not recommended",
    diyColor: r.diyDifficulty === "rookie" ? "text-green-600" : "text-hvac-safety",
  })));

  const mermaidChart = diagnostic_tree_mermaid ?? contentJson?.mermaid_graph ?? (fullCauses?.length > 0
    ? `graph TD\n  A[${symptom.name}] --> ${fullCauses.map((c: any, i: number) => `C${i}[${c.name}]`).join("\n  A --> ")}`
    : null);

  const checklist = diagnostic_checklist ?? [
    "Verify thermostat is set to cool",
    "Replace dirty air filter",
    "Reset HVAC breaker",
    "Check outdoor condenser coil",
  ];

  const whenToCallWarnings = contentJson?.when_to_call_pro?.warnings ?? [
    { type: "Electrical", description: "Contactors, capacitors, control boards require LOTO training." },
    { type: "Refrigerant", description: "EPA Section 608—illegal to vent or handle without license." },
    { type: "Gas", description: "Never modify furnace gas valves or heat exchangers." },
  ];

  const resolvedRelatedLinks = relatedLinks?.map((l: any) => ({
    url: l.slug?.startsWith("/") ? l.slug : `/${l.slug}`,
    label: l.title ?? l.label ?? l.name,
  })) ?? [];

  // Affiliate URL for replaceable parts (capacitor, filter, thermostat, etc.)
  const getPartAffiliateUrl = (name: string, component?: string) => {
    const search = component || name.replace(/Replace|Replacement|Cleaning|Clear/gi, "").trim() || name;
    return `https://www.amazon.com/s?k=${encodeURIComponent("HVAC " + search)}&tag=hvacrevenue-20`;
  };

  // JSON-LD Schema
  const articleSchema = schema_json ?? {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${symptom.name}: Professional HVAC Diagnostic Guide`,
    "description": fastAnswerText,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://hvacrevenueboost.com/diagnose/${symptom.id}` },
  };

  // Canary format: layout + sections — modular SECTION_MAP + resolveLayout (docs/MASTER-PROMPT-CANARY.md)
  if (contentJson?.layout && contentJson?.sections && typeof contentJson.sections === "object") {
    const layoutKey = contentJson.layout as string;
    const layout = resolveLayout(layoutKey);
    const sections = contentJson.sections as Record<string, unknown>;
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
          <nav className="text-sm text-gray-500 dark:text-slate-400 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-hvac-blue">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
            <span className="mx-2">/</span>
            {cluster ? (
              <>
                <Link href={`/${cluster.pillarSlug}`} className="hover:text-hvac-blue">
                  {cluster.pillarSlug.replace("hvac-", "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Link>
                <span className="mx-2">/</span>
                <Link href={`/cluster/${cluster.slug}`} className="hover:text-hvac-blue">{cluster.name}</Link>
                <span className="mx-2">/</span>
              </>
            ) : (
              <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{symptom.name}</span>
          </nav>
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-hvac-blue bg-hvac-blue/10 w-fit px-3 py-1.5 rounded-full border border-hvac-blue/30">
            <span className="text-green-600 dark:text-green-400">✔</span> Reviewed by Certified HVAC Technicians
          </div>
          {layout.map((sectionKey) => {
            const Component = SECTION_MAP[sectionKey];
            const data = sections[sectionKey];
            if (!Component || data === undefined || data === null) return null;
            return (
              <Component
                key={sectionKey}
                data={data}
                symptomName={sectionKey === "hero" ? symptom.name : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

        {/* BREADCRUMBS — HVAC color scheme */}
        <nav className="text-sm text-gray-500 dark:text-slate-400 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-hvac-blue">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue">HVAC Systems</Link>
          <span className="mx-2">/</span>
          {cluster ? (
            <>
              <Link href={`/${cluster.pillarSlug}`} className="hover:text-hvac-blue">
                {cluster.pillarSlug.replace("hvac-", "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/cluster/${cluster.slug}`} className="hover:text-hvac-blue">{cluster.name}</Link>
              <span className="mx-2">/</span>
            </>
          ) : (
            <Link href="/diagnose" className="hover:text-hvac-blue">Diagnostics</Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white font-medium">{symptom.name}</span>
        </nav>

        {/* 1. HERO SECTION */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-hvac-blue bg-hvac-blue/10 w-fit px-3 py-1.5 rounded-full border border-hvac-blue/30">
            <span className="text-green-600 dark:text-green-400">✔</span> Reviewed by Certified HVAC Technicians
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight m-0">
            {symptom.name}: Professional Diagnostic & Repair Guide
          </h1>

          <div className="mt-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed">
            {symptom.description}
          </div>
        </section>

        {/* 2. TECHNICIAN STATEMENT — yellow box, 120–150 words conversational, above fast answer */}
        <section className="mb-12">
          <div className="p-6 sm:p-8 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-hvac-brown-warm rounded-r-xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-hvac-brown dark:text-amber-200 mb-3">Technician Statement</h3>
            <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed m-0">
              {contentJson?.technician_statement ?? contentJson?.field_note ?? technician_insights?.[0] ?? contentJson?.why_this_happens ?? (
                `In the field, ${symptom.name.toLowerCase()} is one of the most common callbacks we see. The good news is that many cases are straightforward—a dirty filter, a tripped breaker, or a thermostat set to heat instead of cool. The trick is ruling out the simple stuff before we start digging into refrigerant levels or electrical components. Restricted airflow from a clogged filter is the number-one cause of reduced cooling; it forces the evaporator to work harder and can even cause ice buildup. If you're seeing weak airflow or ice on the coils, check the filter first. For refrigerant issues, compressor problems, or anything involving electrical work, that's when you should call a pro. EPA Section 608 certification is required for refrigerant handling, and high-voltage components can be dangerous. When in doubt, shut the system off and get a qualified technician out.`
              )}
            </p>
            <p className="text-xs font-bold text-hvac-brown dark:text-amber-200/80 mt-4 m-0 uppercase tracking-widest">
              — ASHRAE Fundamentals & Top Rated Local Techs
            </p>
          </div>
        </section>

        {/* 3. FAST ANSWER */}
        <section className="mb-12" id="fast-answer">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Fast Answer</h2>
          <div className="p-6 bg-hvac-blue/5 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl">
            <p className="text-xl font-medium text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
              {fastAnswerText}
            </p>
          </div>
        </section>

        {/* 3. MOST COMMON FIX — green border, reassuring */}
        {(most_common_fix || firstCause) && (
          <section className="mb-12" id="common-fix">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Most Common Fix</h2>
            <div className="bg-white dark:bg-slate-900 border-2 border-green-500 dark:border-green-600 p-6 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h3 className="text-2xl font-black text-hvac-navy dark:text-white m-0">
                  {most_common_fix?.name ?? firstCause?.name ?? "Dirty Air Filter"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-md">
                  {most_common_fix?.description ?? firstCause?.explanation ?? "Restricted airflow reduces cooling capacity."}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Est Cost:</span>
                  <span className="font-black text-hvac-navy dark:text-white">{most_common_fix?.cost ?? "$50–$150"}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Difficulty:</span>
                  <span className="font-black text-green-600 dark:text-green-400">{most_common_fix?.difficulty ?? "Easy"}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">DIY:</span>
                  <span className="font-black text-green-600 dark:text-green-400">{most_common_fix?.diy !== false ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm font-medium">
              Low refrigerant or HVAC recharge is a common issue and straightforward for licensed pros—don&apos;t ignore symptoms; early diagnosis saves money and avoids costly repairs.
            </p>
          </section>
        )}

        {/* 4. SIMPLE DIY FIXES */}
        <section className="mb-12 bg-hvac-brown/5 dark:bg-hvac-brown/10 p-8 rounded-2xl border border-hvac-brown/20 dark:border-hvac-brown/30 shadow-sm" id="simple-diy-fixes">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6 m-0 flex items-center gap-2">
            <span>⚡</span> Simple DIY Fixes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Perform these checks immediately before replacing parts or calling a tech.</p>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 mb-6">
            RV/home owners assume risk. If uncomfortable, contact a professional.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {checklist.map((item: string, i: number) => (
              <label key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-hvac-blue transition-colors">
                <input type="checkbox" className="w-5 h-5 mt-0.5 text-hvac-blue rounded focus:ring-hvac-blue" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 5. DIAGNOSTIC FLOWCHART — full width */}
        {mermaidChart && (
          <section className="mb-12" id="flowchart">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Diagnostic Flowchart</h2>
            <div className="w-full overflow-auto bg-hvac-brown/5 dark:bg-hvac-brown/10 border border-hvac-brown/20 dark:border-hvac-brown/30 rounded-xl p-6">
              <MermaidDiagram chart={mermaidChart} title="Diagnostic Flowchart" className="w-full min-w-0" />
            </div>
          </section>
        )}

        {/* 6. GUIDED DIAGNOSIS FILTERS — Environment, Conditions, Noise columns */}
        <section className="mb-16" id="guided-diagnosis">
          <div className="bg-hvac-navy p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-black text-white mb-2">Guided Diagnosis Filters</h2>
            <p className="text-hvac-blue/90 mb-6 text-sm">Select environment, conditions, and noise to narrow down potential causes.</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-hvac-brown/30 p-5 rounded-xl border border-hvac-brown/50">
                <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Environment</h4>
                <div className="flex flex-wrap gap-2">
                  {((guided_diagnosis_filters?.categories?.find((c: any) => c.name === "Environment")?.options) ?? [
                    { slug: "residential", label: "Residential" },
                    { slug: "extreme-heat", label: "Extreme Heat" },
                    { slug: "high-humidity", label: "High Humidity" },
                    { slug: "after-long-trip", label: "After Long Trip" },
                  ]).map((opt: any) => (
                    <Link key={opt.slug} href={`/conditions/${opt.slug}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded transition-colors">
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bg-hvac-brown/30 p-5 rounded-xl border border-hvac-brown/50">
                <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {(guided_diagnosis_filters?.categories?.find((c: any) => c.name === "Conditions")?.options ?? getConditionsForSymptom(symptom.id).map((c) => ({ slug: c.slug, label: c.name }))).map((opt: any) => (
                    <Link key={opt.slug} href={`/conditions/${opt.slug}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded transition-colors">
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bg-hvac-brown/30 p-5 rounded-xl border border-hvac-brown/50">
                <h4 className="text-xs font-black text-hvac-gold uppercase tracking-widest mb-4">Noise(s)</h4>
                <div className="flex flex-wrap gap-2">
                  {((guided_diagnosis_filters?.categories?.find((c: any) => c.name === "Noise")?.options) ?? [
                    { slug: "humming", label: "Humming" },
                    { slug: "clicking", label: "Clicking" },
                    { slug: "grinding", label: "Grinding" },
                    { slug: "no-unusual-noise", label: "No Unusual Noise" },
                  ]).map((opt: any) => (
                    <Link key={opt.slug} href={`/conditions/${opt.slug}`} className="px-3 py-2 bg-hvac-brown/50 hover:bg-hvac-blue text-white text-sm font-bold rounded transition-colors">
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CAUSES AT A GLANCE — top 3 only: 1 easy, 1 medium, 1 hard */}
        {causes?.length > 0 && (() => {
          const norm = (c: any) => (c.difficulty ?? "").toLowerCase();
          const easy = causes.find((c: any) => norm(c) === "easy");
          const moderate = causes.find((c: any) => norm(c) === "moderate");
          const hard = causes.find((c: any) => norm(c) === "hard" || norm(c) === "advanced");
          const uniq = [easy, moderate, hard].filter(Boolean);
          const fill = causes.filter((c: any) => !uniq.includes(c));
          const top3 = [...uniq, ...fill].slice(0, 3);
          return (
            <section className="mb-16" id="causes-at-glance">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Causes at a Glance</h2>
              <div className="overflow-x-auto rounded-xl border border-hvac-brown/20 dark:border-hvac-brown/30">
                <table className="w-full text-sm text-left">
                  <thead className="bg-hvac-brown/10 dark:bg-hvac-brown/20 border-b border-hvac-brown/20">
                    <tr>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">Problem</th>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">Likely Cause</th>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">Difficulty</th>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">DIY Friendly</th>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">Cost</th>
                      <th className="p-4 font-bold text-hvac-navy dark:text-slate-300 uppercase tracking-widest text-xs">Guide</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hvac-brown/10">
                    {top3.map((cause: any, idx: number) => {
                      const origIdx = causes.findIndex((c: any) => c.name === cause.name);
                      const diyFriendly = cause.diyFriendly ?? (fullCauses[origIdx]?.repairDetails?.[0]?.diyDifficulty === "rookie" ? "Yes" : "Not recommended");
                      return (
                        <tr key={idx} className="hover:bg-hvac-brown/5">
                          <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{symptom.name}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">{cause.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${cause.difficultyColor ?? "text-hvac-blue"}`}>
                              {cause.difficulty ?? "Moderate"}
                            </span>
                          </td>
                          <td className={`p-4 font-bold ${diyFriendly === "Yes" ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {diyFriendly}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 font-bold">{cause.cost ?? "—"}</td>
                          <td className="p-4">
                            <a href={`#cause-${(origIdx >= 0 ? origIdx : idx) + 1}`} className="text-hvac-blue font-bold hover:underline">View →</a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

        {/* 8. COMMON CAUSES & POSSIBLE FIXES — 3–4 items, DIY rank, safety, cost, time */}
        <section className="mb-16" id="common-causes">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 border-b-2 border-hvac-brown/20 pb-4">
            Common Causes & Possible Fixes
          </h2>
          <div className="space-y-10">
            {(causes ?? []).slice(0, 4).map((cause: any, idx: number) => {
              const fullCause = fullCauses.find((c: any) => c.name === cause.name) ?? fullCauses[idx];
              const rawRepairs = (fullCause?.repairDetails?.length ?? 0) > 0 ? fullCause.repairDetails : cause.repairs ?? [];
              const toCost = (ec: string) => ec === "low" ? "$50–$150" : ec === "medium" ? "$150–$450" : "$450+";
              const toDiyPro = (ec: string) => ec === "low" ? { diy: "$30–$50", pro: "$80–$150" } : ec === "medium" ? { diy: "$80–$150", pro: "$200–$500" } : { diy: "$100–$200", pro: "$1000–$2500" };
              const diyRank = (d: string) => d === "rookie" ? "Beginner" : d === "moderate" ? "Intermediate" : d === "advanced" ? "Advanced" : "Pro Only";
              const timeForRepair = (r: any) => {
                const ec = r.estimatedCost ?? "low";
                const diff = r.diyDifficulty ?? "moderate";
                if (diff === "professional-only") return "Leave to pros";
                if (/filter|drain/i.test(r.name)) return "5–15 min";
                if (/capacitor|contactor|thermostat/i.test(r.name)) return "30–60 min";
                if (ec === "high") return "2–4 hrs (pro)";
                return "30–90 min";
              };
              const repairs = rawRepairs.map((r: any) => {
                const ec = r.estimatedCost ?? (r.cost?.includes("450") ? "high" : r.cost?.includes("150") ? "medium" : "low");
                const { diy, pro } = toDiyPro(ec);
                return {
                  name: r.name,
                  cost: r.cost ?? toCost(ec),
                  difficulty: r.difficulty ?? (r.diyDifficulty === "rookie" ? "Easy" : "Moderate"),
                  diyRank: diyRank(r.diyDifficulty ?? "moderate"),
                  safetyConcerns: r.safetyConcerns ?? [],
                  time: r.time ?? timeForRepair(r),
                  link: r.link ?? `/fix/${r.slug || r.id}`,
                  diyCost: r.diyCost ?? diy,
                  proCost: r.proCost ?? r.cost ?? pro,
                };
              });
              const isEasy = (cause.difficulty ?? "").toLowerCase() === "easy";
              const isHard = (cause.difficulty ?? "").toLowerCase() === "hard" || (cause.difficulty ?? "").toLowerCase() === "advanced";
              const boxBg = isEasy ? "bg-green-50 dark:bg-green-900/20 border-green-200" : isHard ? "bg-red-50 dark:bg-red-900/20 border-red-200" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200";
              const boxBorder = isEasy ? "border-green-300" : isHard ? "border-red-300" : "border-amber-300";
              return (
                <div key={idx} id={`cause-${idx + 1}`} className="border-l-4 border-hvac-blue pl-6">
                  <h3 className="text-2xl font-bold text-hvac-navy dark:text-white mb-2">{idx + 1}. {cause.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-2"><strong>Symptoms:</strong> {cause.symptoms ?? cause.explanation}</p>
                  <p className="text-slate-600 dark:text-slate-400 mb-6"><strong>Why it happens:</strong> {cause.explanation}</p>

                  {repairs.length > 0 ? repairs.map((repair: any, rIdx: number) => {
                    const isPart = /replace|filter|capacitor|thermostat|contactor|motor/i.test(repair.name);
                    const partUrl = repair.affiliate_link ?? (isPart ? getPartAffiliateUrl(repair.name, repair.component) : null);
                    const diyCost = repair.diyCost ?? (isEasy ? "$30–$50" : isHard ? "$100–$200" : "$50–$100");
                    const proCost = repair.proCost ?? repair.cost ?? (isEasy ? "$80–$150" : isHard ? "$1000–$2500" : "$200–$500");
                    const safetyLabels: Record<string, string> = { refrigerant: "Refrigerant (EPA 608)", electrical: "Electrical", high_voltage: "High Voltage", gas: "Gas" };
                    return (
                      <div key={rIdx} className={`${boxBg} ${boxBorder} border-2 p-6 rounded-xl mb-4`}>
                        <Link href={repair.link ?? `/fix/${repair.slug ?? repair.id}`} className="block font-bold text-hvac-navy dark:text-white text-lg mb-3">
                          {repair.name} →
                        </Link>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-500">DIY Rank</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{repair.diyRank}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-500">Cost</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{repair.cost}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-500">Time</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{repair.time}</span>
                          </div>
                        </div>
                        {repair.safetyConcerns?.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">Safety:</span>
                            <span className="text-xs text-amber-700 dark:text-amber-400 ml-2">
                              {(repair.safetyConcerns as string[]).map((s) => safetyLabels[s] ?? s).join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 mt-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-500">DIY</span>
                            <button className="px-4 py-2 rounded-lg font-bold text-sm mt-1 bg-green-600 hover:bg-green-700 text-white">
                              {diyCost}
                            </button>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-500">PRO</span>
                            <button className="px-4 py-2 rounded-lg font-bold text-sm mt-1 bg-hvac-blue hover:bg-blue-800 text-white" data-open-lead-modal>
                              {proCost}
                            </button>
                          </div>
                        </div>
                        {partUrl && (
                          <a href={partUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs font-bold text-hvac-blue hover:underline">
                            Buy part →
                          </a>
                        )}
                      </div>
                    );
                  }) : (
                    <div className={`${boxBg} ${boxBorder} border-2 p-6 rounded-xl`}>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">Professional diagnostic recommended.</p>
                      <button data-open-lead-modal className="bg-hvac-blue hover:bg-blue-800 text-white font-bold px-6 py-2 rounded-lg text-sm">
                        Connect With Local Pro →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 10. REPAIR DIFFICULTY MATRIX */}
        {repairs?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Repair Difficulty Matrix</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Repair</th>
                    <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Difficulty</th>
                    <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Cost</th>
                    <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-center">DIY Friendly?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {repairs.map((repair: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{repair.name}</td>
                      <td className="p-4">
                        <div className={`w-2 h-2 rounded-full ${repair.difficultyBg ?? "bg-hvac-gold"} inline-block mr-2`}></div>
                        {repair.difficulty}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{repair.cost}</td>
                      <td className={`p-4 text-center font-bold ${repair.diyColor ?? "text-hvac-gold"}`}>{repair.diyText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 11. PARTS LIKELY INVOLVED */}
        {components?.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Parts Likely Involved</h2>
            <ul className="space-y-3 list-none p-0">
              {components.map((comp: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={comp.link ?? "#"}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">{comp.name}</span>
                    <span className="text-hvac-blue text-sm">View Component →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 13. TOOLS REQUIRED — single row, full width, image placeholder for Amazon affiliate */}
        <section className="mb-16 w-full">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Tools Required for Diagnosis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {((tools_required?.length > 0 ? tools_required : tools?.map((t: any) => ({ name: t.name, reason: t.description, affiliateUrl: t.affiliateUrl ?? null })) ?? [
              { name: "Multimeter", reason: "Check voltage at disconnect and capacitor", affiliateUrl: null },
              { name: "Coil cleaner", reason: "Remove evaporator buildup", affiliateUrl: null },
              { name: "Thermometer", reason: "Measure supply vs return air temp", affiliateUrl: null },
              { name: "Inspection mirror", reason: "View hard-to-reach coil areas", affiliateUrl: null },
            ]).slice(0, 4)).map((tool: any, idx: number) => {
              const t = { ...tool, affiliateUrl: tool.affiliateUrl ?? null };
              return (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col">
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                    Image
                  </div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">{t.reason ?? t.description}</div>
                  {t.affiliateUrl ? (
                    <a href={t.affiliateUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs font-bold text-hvac-blue hover:underline">
                      View on Amazon →
                    </a>
                  ) : (
                    <span className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">Affiliate link coming soon</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 13b. COMPONENTS FOR FIXES — top 4 items, Amazon placeholder, pro-only label */}
        <section className="mb-16 w-full">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Components for Fixes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {((contentJson?.components_for_fixes ?? contentJson?.fix_components)?.length > 0
              ? (contentJson?.components_for_fixes ?? contentJson?.fix_components).slice(0, 4)
              : [
                  { name: "Thermostat", description: "Programmable or smart thermostat replacement", proOnly: false, affiliateUrl: null },
                  { name: "Air Filter", description: "MERV 8–11 for most residential systems", proOnly: false, affiliateUrl: null },
                  { name: "Refrigerant", description: "EPA 608 required—licensed pros only", proOnly: true, affiliateUrl: null },
                  { name: "Circuit Breaker", description: "HVAC disconnect or panel breaker", proOnly: false, affiliateUrl: null },
                ]
            ).map((item: any, idx: number) => {
              const p = { ...item, proOnly: item.proOnly ?? false, affiliateUrl: item.affiliateUrl ?? null };
              return (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col relative">
                  {p.proOnly && (
                    <span className="absolute top-2 right-2 text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">
                      Pro Only
                    </span>
                  )}
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                    Image
                  </div>
                  <div className="font-bold text-slate-700 dark:text-slate-300">{p.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-1">{p.description ?? p.reason}</div>
                  {p.affiliateUrl ? (
                    <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs font-bold text-hvac-blue hover:underline">
                      View on Amazon →
                    </a>
                  ) : (
                    <span className="mt-3 text-xs text-slate-400 dark:text-slate-500 italic">Affiliate link coming soon</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 12. TYPICAL REPAIR COSTS — horizontal row */}
        <section className="mb-16" id="cost">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Typical Repair Costs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Green: DIY / Low */}
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl">
              <h3 className="text-sm font-black text-green-800 dark:text-green-200 uppercase tracking-widest mb-2">DIY / Low</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-200 m-0">$50–$150</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Filter, drain line, basic maintenance.</p>
            </div>
            {/* Yellow: Moderate */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 p-6 rounded-xl">
              <h3 className="text-sm font-black text-amber-800 dark:text-amber-200 uppercase tracking-widest mb-2">Moderate</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-200 m-0">$150–$450</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Capacitor, contactor, thermostat.</p>
              <button data-open-lead-modal className="mt-4 text-sm font-bold text-hvac-blue hover:underline">Find local services →</button>
            </div>
            {/* Red: Professional */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-hvac-safety/50 p-6 rounded-xl">
              <h3 className="text-sm font-black text-red-800 dark:text-red-200 uppercase tracking-widest mb-2">Professional</h3>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-200 m-0">$450+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Refrigerant, compressor, electrical.</p>
              <button data-open-lead-modal className="mt-4 bg-hvac-safety hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm transition-colors">
                Connect With Local Pro →
              </button>
            </div>
          </div>
        </section>

        {/* 13. TECHNICIAN INSIGHTS — 2 per page, 50–75 words each, with citations */}
        {(() => {
          const defaultInsights = [
            { text: "Restricted airflow from a dirty filter is the number-one field fix for reduced cooling. Per ASHRAE fundamentals, less air means less heat transfer—the evaporator can't cool refrigerant enough. Check the filter first; it's often a 5-minute fix that prevents ice buildup and compressor strain.", cite: "ASHRAE Fundamentals, Ch. 32" },
            { text: "Refrigerant work requires EPA Section 608 certification. Venting or recharging without a license is illegal and can void warranties. Low refrigerant usually indicates a leak; adding charge without fixing the leak wastes money and risks compressor damage.", cite: "EPA 40 CFR Part 82" },
          ];
          const insights = technician_insights?.length >= 2
            ? technician_insights.slice(0, 2).map((t: string | { text?: string; cite?: string }) => typeof t === "string" ? { text: t, cite: "Top Rated Local Techs" } : { text: (t as any).text ?? String(t), cite: (t as any).cite ?? "Top Rated Local Techs" })
            : defaultInsights;
          return (
            <section className="mb-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Technician Insights</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {insights.slice(0, 2).map((insight: { text: string; cite?: string } | string, idx: number) => {
                  const item = typeof insight === "string" ? { text: insight, cite: "Top Rated Local Techs" } : insight;
                  return (
                    <div key={idx} className="relative bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-hvac-blue">
                      <p className="text-slate-700 dark:text-slate-300 italic m-0">&quot;{item.text}&quot;</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-3 m-0">— {item.cite}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 15. WHAT HAPPENS IF YOU IGNORE THIS — hvac-gold/amber warning */}
        <section className="mb-16">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-hvac-gold/50 p-8 rounded-2xl">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-3 flex items-center gap-2">
              ⚠️ What Happens If You Ignore This?
            </h2>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed m-0">
              {contentJson?.cost_of_delay ??
                "Running a failing system often leads to cascaded damage, increasing a $50 repair into a $2,500 compressor replacement."}
            </p>
          </div>
        </section>

        {/* 16. COMMON MISTAKES & 17. ENVIRONMENT CONDITIONS — with time estimates */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <section id="common-mistakes">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Common DIY Mistakes</h2>
            <ul className="space-y-4 list-none p-0">
              {(common_mistakes?.length > 0 ? common_mistakes : [
                { name: "Running the system with ice on coils", description: "Turn off, let thaw. Running the compressor while frozen strains the motor.", time: "5–30 min to thaw" },
                { name: "Ignoring the filter", description: "Dirty filter is the #1 cause of airflow and cooling issues. Replace or clean monthly.", time: "5–15 min" },
                { name: "Handling refrigerant yourself", description: "EPA Section 608 requires certification. Venting or recharging without a license is illegal.", time: "Leave to pros" },
              ]).map((mistake: any, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-hvac-safety font-black mt-1">✗</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">{mistake.name}</strong>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{mistake.description}</span>
                    {mistake.time && (
                      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Time: {mistake.time}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Environmental Factors</h2>
            <div className="space-y-4">
              {(environment_conditions?.length > 0 ? environment_conditions : [
                { name: "Heavy use", description: "Extended runtime in hot weather increases wear on compressor and capacitor." },
                { name: "High humidity", description: "More condensate; drain lines and coils work harder." },
              ]).map((env: any, idx: number) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{env.name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">{env.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 18. PREVENTION TIPS — ounce of prevention, pound of cure */}
        <section className="mb-16" id="prevention">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Prevention Tips</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium italic">
            An ounce of prevention is worth a pound of cure. Simple maintenance now can prevent costly repairs and system failures later. A $20 filter change can avoid a $2,500 compressor replacement.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
            <ul className="grid sm:grid-cols-3 gap-6 m-0 p-0 list-none">
              {(prevention_tips?.length > 0 ? prevention_tips : [
                { name: "Filter maintenance", description: "Replace or clean monthly during heavy use" },
                { name: "Annual tune-up", description: "Schedule professional maintenance yearly" },
                { name: "Condenser care", description: "Clear debris from outdoor coil" },
              ]).map((tip: any, idx: number) => (
                <li key={idx} className="text-center">
                  <div className="w-12 h-12 bg-hvac-navy text-hvac-gold rounded-full flex items-center justify-center mx-auto mb-3 font-black text-xl">
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{tip.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{tip.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 19. SIGNS IT MIGHT BE MORE SERIOUS — improved warning box (Decision Grid style) */}
        <section className="mb-16">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
            <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200 mb-4 m-0 border-0">
              Signs It Might Be More Serious—or Work Seems Too Complicated
            </h2>
            <p className="text-amber-900 dark:text-amber-200 font-medium leading-relaxed m-0">
              HVAC systems use expensive components, regulated chemicals (refrigerants), high-voltage electricity, and in furnaces, gas lines. Repairs are not necessarily DIY-friendly. If the work involves electrical panels, refrigerant handling, or gas connections—or if you&apos;re unsure—it&apos;s time to call a licensed professional.
            </p>
          </div>
        </section>

        {/* 20. WHEN TO CALL A TECHNICIAN — hvac-safety accent */}
        <section className="mb-16" id="when-to-call">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-hvac-safety/50 p-8 rounded-2xl relative">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4 border-0">When to Call a Professional Technician</h2>
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-6">
              HVAC systems utilize dangerous components. Stop DIY efforts and call a pro immediately if you encounter:
            </p>
            <ul className="space-y-4 list-none p-0 mb-8">
              {whenToCallWarnings.map((warning: any, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="bg-hvac-safety/20 text-hvac-safety px-2 py-0.5 rounded text-xs font-black shrink-0 mt-0.5">
                    {warning.type}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm">{warning.description}</span>
                </li>
              ))}
            </ul>
            <DiyLegalDisclaimer />
            <button
              data-open-lead-modal
              className="bg-hvac-safety hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl shadow w-full sm:w-auto text-center cursor-pointer transition uppercase tracking-widest text-sm"
            >
              Connect With Local Pro →
            </button>
          </div>
        </section>

        {/* 21. RELATED DIAGNOSTIC GUIDES — Decision Grid style */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Diagnostic Guides</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Continue troubleshooting with these guides and technical deep-dives.</p>
          <div className="flex flex-wrap gap-3">
            {(() => {
              const links = [
                ...(resolvedRelatedLinks || []).map((link: any) => ({ href: link.url, label: link.label })),
                ...(relatedContent?.relatedSymptoms || []).map((s: any) => ({ href: `/diagnose/${s.id}`, label: s.name })),
              ];
              const fallbacks = [
                { href: "/diagnose/ac-not-cooling", label: "AC Not Cooling" },
                { href: "/diagnose/ac-blowing-warm-air", label: "AC Blowing Warm Air" },
                { href: "/diagnose/ac-freezing-up", label: "AC Freezing Up" },
                { href: "/diagnose/ac-not-turning-on", label: "AC Not Turning On" },
              ];
              const items = links.length > 0 ? links.slice(0, 6) : fallbacks;
              return items.map((item: { href: string; label: string }, idx: number) => (
                <Link key={idx} href={item.href} className="text-sm font-bold text-hvac-blue hover:underline">
                  {item.label} →
                </Link>
              ));
            })()}
          </div>
        </section>

        {/* 22. NARROW YOUR DIAGNOSIS + RELATED PROBLEMS — 1-2 environments, 1-2 conditions */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Narrow Your Diagnosis</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">1–2 environments and 1–2 conditions to pinpoint the issue.</p>
              <div className="space-y-3">
                {(environment_conditions?.slice(0, 2) ?? [
                  { name: "Hot weather", description: "System under peak load" },
                  { name: "After long trip", description: "RV/home sat unused" },
                ]).map((env: any, i: number) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{env.name}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-sm ml-2">— {env.description}</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 mt-4">
                  {getConditionsForSymptom(symptom.id).slice(0, 2).map((c) => (
                    <Link key={c.slug} href={`/conditions/${c.slug}`} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white transition-colors">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Problems</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">1–2 environments and 1–2 conditions that share causes.</p>
              <div className="flex flex-wrap gap-3">
                {resolvedRelatedLinks.slice(0, 2).map((link: any, idx: number) => (
                  <Link key={idx} href={link.url} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-bold text-hvac-blue hover:border-hvac-blue hover:shadow transition-colors">
                    {link.label} →
                  </Link>
                ))}
                {relatedContent?.relatedSymptoms?.slice(0, 2).map((s: any) => (
                  <Link key={s.id} href={`/diagnose/${s.id}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-bold text-hvac-blue hover:border-hvac-blue hover:shadow transition-colors">
                    {s.name} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 23. LOCAL SERVICE CTA — hvac-navy + hvac-gold */}
        <section className="mb-16" id="get-quote">
          <div className="bg-hvac-navy text-white p-10 md:p-14 rounded-3xl relative overflow-hidden shadow-2xl text-center">
            <div className="absolute inset-0 bg-hvac-blue opacity-20 blur-3xl rounded-full scale-150"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black m-0 mb-6 border-0 text-white">
                Find Local HVAC Repair Help
              </h2>
              <p className="text-slate-300 text-lg md:text-xl mb-8">
                Stop guessing and risking a $2,500 compressor failure. Connect with licensed technicians to fix your cooling immediately.
              </p>
              <button
                data-open-lead-modal
                className="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-lg shadow-xl hover:scale-105 transition-transform w-full sm:w-auto"
              >
                Request Diagnostic Today
              </button>
            </div>
          </div>
        </section>

        {/* 24. FAQ — minimum 4 items */}
        <section className="mb-16" id="faq">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 border-0">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {(() => {
              const baseFaq = faq?.length > 0 ? faq : fullCauses.map((c: any) => ({
                question: `Can a ${c.name.toLowerCase()} cause ${symptom.name.toLowerCase()}?`,
                answer: c.explanation,
              }));
              const defaultFaq = [
                { question: `Why is my ${symptom.name.toLowerCase()}?`, answer: "Most often caused by restricted airflow (dirty filter), low refrigerant, or electrical issues. Check the filter first, then verify the outdoor unit is running." },
                { question: "When should I call a professional?", answer: "Call a pro if you suspect refrigerant leaks, electrical faults, or compressor issues. EPA Section 608 requires certification for refrigerant work." },
                { question: "How much does repair typically cost?", answer: "Simple fixes like filter replacement run $50–$150. Capacitor or contactor repairs often $150–$450. Refrigerant or compressor work can exceed $450." },
                { question: "Can I fix this myself?", answer: "Filter and drain line issues are often DIY-friendly. Electrical and refrigerant work should be left to licensed professionals." },
              ];
              const merged = baseFaq.length >= 4 ? baseFaq : [...baseFaq, ...defaultFaq.slice(0, 4 - baseFaq.length)];
              return merged.slice(0, Math.max(4, merged.length)).map((item: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 m-0">{item.question}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 m-0 leading-relaxed text-sm">{item.answer}</p>
                </div>
              ));
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
