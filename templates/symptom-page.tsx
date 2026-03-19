/**
 * Symptom Page Template — FINAL (unlocked for canary)
 * Canonical structure. See docs/TEMPLATE-LOCKED.md and public/mockup-diagnostic-page.html
 *
 * Hardened 21-point Master Content Prompt. HVAC Revenue Boost color scheme:
 * hvac-navy (#0a192f), hvac-blue (#1e3a8a), hvac-gold (#d4af37), hvac-safety (#e53e3e)
 */
import React from "react";
import Link from "next/link";
import { ChevronDown, CloudRain, Wind, ThermometerSnowflake, Power, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { injectLinks } from "../lib/seo/injectLinks";
import { SeoLinks } from "../lib/seo/types";
import { ELECTRICAL_NOTE, CHEMICAL_NOTE, MECHANICAL_NOTE, STRUCTURAL_NOTE, FIELD_NOTE, DIY_PRO_NOTE } from "@/lib/static-notes";
import { RepairItem } from "@/lib/monetization/repairs";
import dynamic from "next/dynamic";
import DiyDifficultyMeter, { DiyLegalDisclaimer } from "@/components/DiyDifficultyMeter";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });
const DecisionTree = dynamic(() => import("@/components/DecisionTree"), { ssr: false });
const AdaptiveDiagnosticPanel = dynamic(() => import("@/components/AdaptiveDiagnosticPanel"), { ssr: false });
const AdaptiveRepairMatrix = dynamic(() => import("@/components/AdaptiveRepairMatrix"), { ssr: false });


import CauseCard from "@/components/CauseCard";
import SystemCard from "@/components/SystemCard";
import ServiceCTA from "@/components/ServiceCTA";
import { getConditionsForSymptom } from "@/lib/conditions";
import { getClusterForSymptom } from "@/lib/clusters";
import { SECTION_MAP } from "@/components/sections";
import { normalizeItems, normalizeComponents, normalizeTools } from "@/lib/text-format";
import SystemOverviewBlock from "@/components/sections/SystemOverviewBlock";
import ConditionalDiagram from "@/components/ConditionalDiagram";
import AmazonDisclosure from "@/components/AmazonDisclosure";
import { resolveLayout } from "@/lib/layout-resolver";
import { normalizeToString } from "@/lib/utils";
import { getImageSrc, PLACEHOLDER_IMAGE } from "@/lib/image-fallbacks";
import { getImageForPage } from "@/lib/image-for-page";
import type { BasePageViewModel } from "@/lib/content";

export default function SymptomPageTemplate({
  symptom,
  pageViewModel,
  causeIds,
  causeDetails,
  diagnosticSteps,
  relatedContent,
  internalLinks,
  relatedLinks,
  seoLinks,
  tools,
  getCauseDetails,
  qualityScore = 100,
  scalingData
}: {
  symptom: { id: string; name: string; description?: string };
  pageViewModel: BasePageViewModel;
  causeIds?: string[];
  causeDetails?: any[];
  diagnosticSteps?: any[];
  relatedContent?: any;
  internalLinks?: any[];
  relatedLinks?: any;
  seoLinks?: SeoLinks | any;
  tools?: any[];
  getCauseDetails?: (id: string) => any;
  qualityScore?: number;
  scalingData?: {
    narrowDownSteps?: string[];
    systemExplanation: string[];
    repairs?: RepairItem[];
    relatedLinks?: any;
    decisionTree?: any;
    subtitle?: string | null;
    diagnosticFlow?: Array<{ step: number; title: string; actions: string[]; interpretation: string; field_insight?: string; related_causes?: string[] }> | null;
    quickTools?: Array<{ name: string; why: string; href: string }> | null;
    clusterNav?: string[] | null;
    topCauses?: Array<{ name: string; explanation: string; severity?: string; likelihood?: string }> | null;
    repairMatrix?: {
      electrical?: Array<{ name: string; difficulty: string; estimated_cost_range?: string; description?: string }>;
      mechanical?: Array<{ name: string; difficulty: string; estimated_cost_range?: string; description?: string }>;
      structural?: Array<{ name: string; difficulty: string; estimated_cost_range?: string; description?: string }>;
    } | null;
  };
}) {
  // Resolve causes from DB or static KG
  const fullCauses = (Array.isArray(causeDetails) && causeDetails.length > 0)
    ? causeDetails
    : (causeIds || []).map((id: string) => getCauseDetails?.(id)).filter(Boolean);
  const firstCause = fullCauses[0] as { name?: string; explanation?: string } | null;
  const cluster = getClusterForSymptom(symptom.id);

  // All content from normalized pageViewModel (never raw DB JSON)
  const vm = pageViewModel;
  const fastAnswerText = vm.fastAnswer ?? (firstCause
    ? `Likely caused by ${firstCause.name}. ${firstCause.explanation || ""}`
    : symptom.description);

  let fastAnswerHtml = fastAnswerText;
  if (seoLinks?.contextual_links?.quick_answer) {
    fastAnswerHtml = injectLinks(fastAnswerText, seoLinks.contextual_links.quick_answer, 1);
  }

  let descriptionHtml = symptom.description;
  if (seoLinks?.contextual_links?.short_explanation) {
    descriptionHtml = injectLinks(symptom.description || "", seoLinks.contextual_links.short_explanation, 1);
  }

  const causes = (vm.rankedCauses?.length ?? 0) > 0
    ? vm.rankedCauses!.map((c) => ({
        name: c.name,
        symptoms: c.symptoms ?? c.explanation,
        explanation: c.explanation ?? c.why,
        indicator: c.indicator,
        difficulty: c.difficulty ?? "Moderate",
        difficultyColor: c.difficultyColor ?? "text-hvac-blue",
        cost: c.cost ?? c.estimated_cost,
        likelihood: c.likelihood,
        risk: c.risk,
        why: c.why,
        diagnose_slug: c.diagnose_slug,
        repair_slug: c.repair_slug,
        estimated_cost: c.estimated_cost,
        pillar: c.pillar,
        faulty_item: c.faulty_item,
        diy_friendly: c.diy_friendly,
        repairs: (c.repairs ?? []).map((r) => ({
          name: r.name,
          description: r.explanation,
          cost: r.cost ?? r.estimated_cost ?? c.estimated_cost,
          difficulty: r.difficulty,
          link: r.link ?? (r.slug ? `/fix/${r.slug}` : c.repair_slug ? `/fix/${c.repair_slug}` : undefined),
          badges: {},
        })),
      }))
    : (fullCauses as any[]).map((c: any) => ({
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

  const allRepairsRaw = (vm.repairOptions?.length ?? 0) > 0
    ? vm.repairOptions!.map((r) => {
        const d = (r.difficulty ?? "").toLowerCase();
        const isRookie = d === "rookie" || d === "easy";
        const isPro = d.includes("professional") || d === "advanced";
        return {
          name: r.name,
          difficulty: r.difficulty ?? "Moderate",
          difficultyBg: isPro ? "bg-hvac-safety" : "bg-hvac-gold",
          cost: r.cost ?? r.estimated_cost ?? "$50–$150",
          diyText: isRookie ? "Yes" : "Not recommended",
          diyColor: isRookie ? "text-green-600" : "text-hvac-safety",
          _isLow: isRookie || d === "low",
          _isPro: isPro,
        };
      })
    : (fullCauses as any[]).flatMap((c: any) => (c.repairDetails || []).map((r: any) => {
        const d = (r.diyDifficulty ?? "").toLowerCase();
        const isRookie = d === "rookie" || d === "easy";
        const isPro = d === "professional-only" || d.includes("professional") || d === "advanced";
        return {
          name: r.name,
          difficulty: r.diyDifficulty === "rookie" ? "Easy" : "Moderate",
          difficultyBg: isPro ? "bg-hvac-safety" : "bg-hvac-gold",
          cost: r.estimatedCost === "low" ? "$50–$150" : r.estimatedCost === "medium" ? "$150–$450" : "$450+",
          diyText: isRookie ? "Yes" : "Not recommended",
          diyColor: isRookie ? "text-green-600" : "text-hvac-safety",
          _isLow: isRookie || d === "low",
          _isPro: isPro,
        };
      }));

  // Repair Difficulty Matrix: max 6 items, low+moderate only, NO professional
  const repairs = allRepairsRaw
    .filter((r: any) => !r._isPro)
    .sort((a: any, b: any) => (a._isLow ? 0 : 1) - (b._isLow ? 0 : 1)) // low first
    .slice(0, 6);

  const rawChecklist = vm.checklist ?? vm.diagnosticFlow?.steps ?? null;
  // Also accept new diagnostic_flow format from scalingData
  const diagnosticFlowSteps = scalingData?.diagnosticFlow;
  const checklist: string[] = (() => {
    // Priority 1: scalingData.diagnosticFlow (new schema)
    if (Array.isArray(diagnosticFlowSteps) && diagnosticFlowSteps.length > 0) {
      return diagnosticFlowSteps.map((s: any) =>
        typeof s === "string" ? s :
        typeof s?.title === "string" ? s.title :
        typeof s?.instruction === "string" ? s.instruction : null
      ).filter(Boolean) as string[];
    }
    // Priority 2: vm.checklist (legacy)
    if (Array.isArray(rawChecklist) && rawChecklist.length > 0) {
      return rawChecklist.map((item: any) =>
        typeof item === "string" ? item :
        typeof item?.instruction === "string" ? item.instruction :
        typeof item?.text === "string" ? item.text :
        null
      ).filter(Boolean) as string[];
    }
    // Fallback
    return [
      "Verify thermostat is set to cool and set below room temperature",
      "Replace dirty air filter — a clogged filter is the #1 cause of reduced airflow",
      "Reset the HVAC breaker at the panel and wait 30 seconds before restarting",
      "Check outdoor condenser coil for debris, ice, or blockage",
    ];
  })();

  const whenToCallWarnings = vm.whenToCallProWarnings ?? [
    { type: "Electrical", description: "Contactors, capacitors, control boards require LOTO training." },
    { type: "Refrigerant", description: "EPA Section 608—illegal to vent or handle without license." },
    { type: "Gas", description: "Never modify furnace gas valves or heat exchangers." },
  ];

  const resolvedRelatedLinks = (vm.relatedLinks?.length ?? 0) > 0
    ? vm.relatedLinks!.map((l) => ({ url: l.url, label: l.label }))
    : relatedLinks?.map((l: any) => ({
        url: (l.slug?.startsWith("/") ? l.slug : `/${l.slug}`) ?? "#",
        label: l.title ?? l.label ?? l.name ?? "",
      })) ?? [];

  const mostCommonFixCard = vm.mostCommonFixCard;
  const guidedFilters = vm.guidedFilters?.categories;
  const components = vm.components ?? [];
  const toolsRequired = vm.toolsRequired ?? [];
  const technicianInsights = vm.technicianInsights ?? [];
  const commonMistakes = vm.commonMistakes ?? [];
  const environmentConditions = vm.environmentConditions ?? [];
  const preventionTips = vm.preventionTips ?? [];
  const faq = vm.faq ?? [];

  // Affiliate URL for replaceable parts (capacitor, filter, thermostat, etc.)
  const getPartAffiliateUrl = (name: string, component?: string) => {
    const search = component || name.replace(/Replace|Replacement|Cleaning|Clear/gi, "").trim() || name;
    return `https://www.amazon.com/s?k=${encodeURIComponent("HVAC " + search)}&tag=hvacrevenue-20`;
  };

  // JSON-LD Schema
  const articleSchema = vm.schemaJson ?? {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${symptom.name}: Professional HVAC Diagnostic Guide`,
    "description": fastAnswerText,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://hvacrevenueboost.com/diagnose/${symptom.id}` },
  };

  // Canary format: layout + sections — modular SECTION_MAP + resolveLayout (docs/MASTER-PROMPT-CANARY.md)
  const sectionsObj = vm.sections && typeof vm.sections === "object" ? vm.sections : {};
  const hasCanarySections = vm.layout && Object.keys(sectionsObj).length > 0;
  if (hasCanarySections && vm.layout) {
    const layout = resolveLayout(vm.layout);
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
            if (sectionKey === "system_overview") {
              return <SystemOverviewBlock key="system_overview" variant="symptom" />;
            }
            if (sectionKey === "conditional_diagram") {
              return <ConditionalDiagram key="conditional_diagram" symptomSlug={symptom.id} />;
            }
            const Component = SECTION_MAP[sectionKey];
            const data = sectionsObj[sectionKey];
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

          <div 
            className="mt-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: descriptionHtml || "" }}
          />
        </section>

        <SystemOverviewBlock variant="symptom" />

        {/* 2. TECHNICIAN STATEMENT — UX ENHANCED */}
        <section className="mb-12">
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 text-sm rounded-r-xl shadow-sm">
            <strong className="text-hvac-brown dark:text-amber-200 uppercase tracking-widest text-xs">Technician Insight:</strong>
            <p className="mt-2 text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {FIELD_NOTE}
            </p>
          </div>
        </section>

        {/* 3. FAST ANSWER — 2–3 sentence explanation */}
        {fastAnswerText && fastAnswerText.length >= 80 && (
          <section className="mb-12" id="fast-answer">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Fast Answer</h2>
            <div className="p-6 bg-hvac-blue/5 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl">
              <p 
                className="text-xl font-medium text-slate-800 dark:text-slate-200 m-0 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: fastAnswerHtml || "" }}
              />
            </div>
          </section>
        )}

        {/* ADAPTIVE DIAGNOSTIC PANEL 🔥 — Decision Tree + Diagnostic Flow with shared cause ID state */}
        <AdaptiveDiagnosticPanel
          decisionTree={scalingData?.decisionTree ?? null}
          diagnosticFlow={scalingData?.diagnosticFlow ?? []}
          slug={symptom.id}
        />


        {/* 5. MOST COMMON FIX — green border, reassuring */}
        {(mostCommonFixCard || firstCause) && (
          <section className="mb-12" id="common-fix">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Most Common Fix</h2>
            <div className="bg-white dark:bg-slate-900 border-2 border-green-500 dark:border-green-600 p-6 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h3 className="text-2xl font-black text-hvac-navy dark:text-white m-0">
                  {mostCommonFixCard?.name ?? (firstCause as { name?: string })?.name ?? "Dirty Air Filter"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-md">
                  {mostCommonFixCard?.description ?? (firstCause as { explanation?: string })?.explanation ?? "Restricted airflow reduces cooling capacity."}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Est Cost:</span>
                  <span className="font-black text-hvac-navy dark:text-white">{mostCommonFixCard?.cost ?? "$50–$150"}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Difficulty:</span>
                  <span className="font-black text-green-600 dark:text-green-400">{mostCommonFixCard?.difficulty ?? "Easy"}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">DIY:</span>
                  <span className="font-black text-green-600 dark:text-green-400">{mostCommonFixCard?.diy !== false ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm font-medium">
              Low refrigerant or HVAC recharge is a common issue and straightforward for licensed pros—don&apos;t ignore symptoms; early diagnosis saves money and avoids costly repairs.
            </p>
          </section>
        )}

        {/* 4. 30-SECOND SUMMARY / SIMPLE DIY FIXES */}
        <section className="mb-12 bg-hvac-brown/5 dark:bg-hvac-brown/10 p-8 rounded-2xl border border-hvac-brown/20 dark:border-hvac-brown/30 shadow-sm" id="simple-diy-fixes">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6 m-0 flex items-center gap-2">
            <span>⚡</span> 30-Second Summary
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

        {/* NARROW DOWN removed — replaced by Diagnostic Flow steps above */}

        {/* QUICK TOOLS — what you need to diagnose this issue */}
        {scalingData?.quickTools && scalingData.quickTools.length > 0 && (
          <section className="mb-12" id="quick-tools">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">🔧 Tools You&apos;ll Need</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">These tools are used in the diagnostic flow for this symptom.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {scalingData.quickTools.map((tool, i) => (
                <a
                  key={i}
                  href={tool.href || `https://www.amazon.com/s?k=${encodeURIComponent("HVAC " + tool.name)}&tag=hvacrevenue-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-hvac-gold hover:shadow-md transition-all"
                >
                  <span className="font-bold text-hvac-navy dark:text-white text-sm">{tool.name}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tool.why}</span>
                  <span className="text-xs font-bold text-hvac-gold mt-auto">View on Amazon →</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 1. DIY VS PRO — STATIC chart: Only air filter is DIY; all others Pro (same on every page) */}
        <section className="mb-12" id="diy-vs-pro">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">DIY vs Professional</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Only clogged air filter is DIY-friendly. Electrical, chemical, and mechanical work require a professional.</p>
          <MermaidDiagram
            chart={`flowchart TD
  A[Repair Type] --> B{Which system?}
  B -->|Electrical| C[🔴 Professional Required]
  B -->|Chemical / Refrigerant| D[🔴 Professional Required]
  B -->|Mechanical| E[🔴 Professional Required]
  B -->|Structural| F[🟢 DIY Possible]
  F --> F1[Clogged air filter only]
  F1 --> F2[⚠ May void warranty]`}
            title="DIY vs Pro by System"
            className="min-h-[280px]"
          />
          {/* 4 pillar boxes: neutral background + badge only (no red blocks) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { slug: "electrical", label: "Electrical", badge: "🔴 Professional Required" },
              { slug: "structural", label: "Structural (Ducting)", badge: "🟢 DIY Safe" },
              { slug: "chemical", label: "Chemical (Refrigeration)", badge: "🔴 Professional Required" },
              { slug: "mechanical", label: "Mechanical", badge: "🔴 Professional Required" },
            ].map(({ slug, label, badge }) => (
              <div key={slug} className="rounded-xl p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                <h4 className="font-bold text-hvac-navy dark:text-white mb-2 uppercase tracking-wide">{label}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {slug === "structural" ? "Clogged air filter, dirty filter — replace monthly." : "Professional recommended for safety and warranty."}
                </p>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{badge}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. COMMON CAUSES AT A GLANCE — 1 top reason per pillar, 4 columns (incl. Mechanical), green=Structural, red=others */}
        {(() => {
          const pillarOrder = ["Electrical", "Structural", "Chemical", "Mechanical"];
          const inferPillar = (c: any) => {
            const n = (c.name ?? "").toLowerCase();
            if (/capacitor|breaker|contactor|electrical/i.test(n)) return "Electrical";
            if (/filter|duct|blower|airflow|evaporator|clogged/i.test(n)) return "Structural";
            if (/refrigerant|leak|charge/i.test(n)) return "Chemical";
            return "Mechanical";
          };
          const byPillar = (causes ?? []).reduce((acc: Record<string, any[]>, c: any) => {
            const p = c.pillar ? (c.pillar.includes("Duct") || c.pillar.includes("Airflow") ? "Structural" : c.pillar.includes("Refrig") ? "Chemical" : c.pillar) : inferPillar(c);
            const key = p === "Ducting / Airflow" ? "Structural" : p === "Refrigeration" ? "Chemical" : p;
            if (!acc[key]) acc[key] = [];
            acc[key].push(c);
            return acc;
          }, {});
          const placeholders: Record<string, { name: string; why?: string }> = {
            Electrical: { name: "Bad capacitor or tripped breaker", why: "Power delivery issues prevent system from running." },
            Structural: { name: "Clogged or dirty air filter", why: "Restricted airflow reduces cooling capacity." },
            Chemical: { name: "Low refrigerant or leak", why: "Refrigerant level affects cooling. EPA certified pros only." },
            Mechanical: { name: "Compressor or thermostat failure", why: "Component wear or control issues." },
          };
          const onePerPillar = pillarOrder.map((p) => byPillar[p]?.[0] ?? placeholders[p]);
          const isDiyPillar = (p: string) => p === "Structural";
          return (
            <section className="mb-16" id="common-causes-at-glance">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Common Causes at a Glance</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Top reason in each category — one from each pillar. Mechanical included.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pillarOrder.map((p, idx) => {
                  const cause = onePerPillar[idx];
                  const isDiy = isDiyPillar(p);
                  const labels: Record<string, string> = { Electrical: "Electrical", Structural: "Structural (Ducting)", Chemical: "Chemical (Refrigeration)", Mechanical: "Mechanical" };
                  const l = normalizeToString((cause as any).likelihood).toLowerCase();
                  const r = normalizeToString((cause as any).risk).toLowerCase();
                  const likelihood = (l === "high" || l === "medium" || l === "low" ? l : "medium") as "high" | "medium" | "low";
                  const riskVal = (r === "high" || r === "medium" || r === "low" ? r : "medium") as "high" | "medium" | "low";
                  const badge = isDiy ? "🟢 DIY Safe" : "🔴 Professional Required";
                  return (
                    <div key={p} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="p-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-hvac-blue mb-2">{labels[p]}</h4>
                        <CauseCard
                          name={(cause as any).name}
                          likelihood={likelihood}
                          risk={riskVal}
                          description={(cause as any).why ?? (cause as any).explanation ?? ""}
                          diagnoseHref={(cause as any).diagnose_slug ? `/causes/${(cause as any).diagnose_slug}` : "#get-quote"}
                          repairHref={(cause as any).repair_slug ? `/fix/${(cause as any).repair_slug}?ref=diag_${symptom.id}` : "#get-quote"}
                          cost={(cause as any).estimated_cost ?? (cause as any).cost}
                        />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 block">{badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 3. WHY THAT SYSTEM FAILS — 2x2 grid, 50–75 word technical/field note per pillar */}
        <section className="mb-16" id="why-system-fails">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 border-b-2 border-hvac-brown/20 pb-4">
            Why That System Fails
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Technical field notes by category — 50–75 words each.
          </p>
          {(() => {
            const systemCards = (vm.systemCards ?? []).slice(0, 4);
            const cardByPillar = (p: string) => systemCards.find((c) =>
              (p === "Electrical" && /electrical/i.test(c.system)) ||
              (p === "Structural" && /structural|ducting|airflow/i.test(c.system)) ||
              (p === "Chemical" && /chemical|refrigeration/i.test(c.system)) ||
              (p === "Mechanical" && /mechanical/i.test(c.system))
            );
            const fieldNotes: Record<string, string> = {
              Electrical: ELECTRICAL_NOTE,
              Structural: STRUCTURAL_NOTE,
              Chemical: CHEMICAL_NOTE,
              Mechanical: MECHANICAL_NOTE,
            };
            const rows = [
              ["Electrical", "Structural"],
              ["Chemical", "Mechanical"],
            ];
            return (
              <>
                <div className="max-w-7xl mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rows.map((row, ri) =>
                      row.map((p) => {
                        const note = fieldNotes[p];
                        const isDiy = p === "Structural";
                        const badge = isDiy ? "🟢 DIY Safe" : "🔴 Professional Required";
                        return (
                          <div key={p} className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                            <div className="text-xs font-black uppercase tracking-widest text-hvac-blue mb-2">Field Note — {p}</div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{note}</p>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{badge}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                {qualityScore >= 80 && <ServiceCTA variant="primary" />}
              </>
            );
          })()}
        </section>

        {/* 3. DISCLAIMER BLOCK — softened tone, authority-based */}
        <section className="mb-16">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-hvac-blue rounded-r-xl">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 m-0">
              {DIY_PRO_NOTE}
            </p>
          </div>
        </section>

        {/* 4. PILLAR BREAKDOWN — 4 columns (incl. Mechanical), top 5 per system, green=Structural, red=others */}
        {(() => {
          const pillarOrder = ["electrical", "structural", "chemical", "mechanical"];
          const labels: Record<string, string> = {
            electrical: "Electrical",
            structural: "Structural (Ducting)",
            ducting_airflow: "Structural (Ducting)",
            chemical: "Chemical (Refrigeration)",
            refrigeration: "Chemical (Refrigeration)",
            mechanical: "Mechanical",
          };
          const defaultItems: Record<string, { issue: string; explanation?: string; warning?: string; diy_pro: string }[]> = {
            electrical: [{ issue: "Bad capacitor", explanation: "Prevents compressor/fan start", diy_pro: "Pro" }, { issue: "Tripped breaker", diy_pro: "Pro" }, { issue: "Faulty contactor", diy_pro: "Pro" }],
            structural: [{ issue: "Clogged air filter", explanation: "Restricts airflow", diy_pro: "DIY" }, { issue: "Blocked vents", diy_pro: "DIY" }, { issue: "Blower motor", diy_pro: "Pro" }],
            chemical: [{ issue: "Low refrigerant", explanation: "EPA certified pros only", diy_pro: "Pro" }, { issue: "Refrigerant leak", diy_pro: "Pro" }],
            mechanical: [{ issue: "Compressor failure", diy_pro: "Pro" }, { issue: "Thermostat failure", diy_pro: "Pro" }, { issue: "Evaporator coil", diy_pro: "Pro" }],
          };
          const pb = vm.pillarBreakdown ?? {};
          const grouped = vm.groupedCauses ?? {};
          const getItemsForPillar = (slug: string) => {
            const fromPb = pb[slug] ?? pb[slug === "structural" ? "ducting_airflow" : slug === "chemical" ? "refrigeration" : slug];
            if (fromPb && fromPb.length > 0) return fromPb.slice(0, 5).map((x) => ({ issue: x.issue ?? x.explanation, explanation: x.explanation, warning: x.warning, diy_pro: x.diy_pro ?? "Pro" }));
            const fromGrouped = grouped[slug] ?? grouped[slug === "structural" ? "ducting_airflow" : slug === "chemical" ? "refrigeration" : slug];
            if (fromGrouped && fromGrouped.length > 0) return fromGrouped.slice(0, 5).map((c: any) => ({ issue: c.name, explanation: c.why, warning: !c.diy_safe ? "Pro recommended" : undefined, diy_pro: c.diy_safe ? "DIY" : "Pro" }));
            return defaultItems[slug] ?? [];
          };
          const structuralCaveat = "🟢 Some work is DIY friendly. Due to significant cost, damage risk, etc., a pro is highly recommended along with regular service to maintain the system.";
          const proRequired = "🔴 Professional Required";
          return (
            <section className="mb-16" id="pillar-breakdown">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Pillar Breakdown</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Up to Top 5 Reasons per system. Mechanical included. 4 columns aligned with pillars.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pillarOrder.map((slug) => {
                  const items = getItemsForPillar(slug);
                  const isStructural = slug === "structural";
                  return (
                    <div key={slug} className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900 shadow-sm">
                      <h3 className="text-lg font-bold text-hvac-navy dark:text-white mb-4 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-2">
                        {labels[slug] ?? slug.replace(/_/g, " ")}
                      </h3>
                      <ul className="space-y-3 list-none p-0">
                        {items.map((item, i) => (
                          <li key={i} className="flex flex-col gap-1">
                            <span className="font-medium text-slate-800 dark:text-slate-200">• {item.issue}</span>
                            {item.explanation && <span className="text-sm text-slate-600 dark:text-slate-400 ml-4">{item.explanation}</span>}
                            {(item as { warning?: string }).warning && <span className="text-xs text-amber-700 dark:text-amber-400 ml-4">⚠ {(item as { warning?: string }).warning}</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-xs font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
                        {isStructural ? structuralCaveat : proRequired}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 5. DIY VS PRO — second Mermaid: Electrical, Chemical, Mechanical → Pro; Structural (filters, thermostat) → DIY with warranty caveat */}
        <section className="mb-16" id="pillar-triage">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Which System Is Failing?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">These are the four systems that can break in any HVAC system. Narrow by pillar to diagnose.</p>
          {(() => {
            const symName = (symptom.name ?? "Symptom").replace(/"/g, "'");
            const pillarTriageChart = vm.diagnosticFlowMermaid ?? vm.causeConfirmationMermaid ?? `flowchart TD
  A["${symName}"] --> B{Which system is failing?}
  B --> C[Electrical]
  B --> D[Structural]
  B --> E[Chemical]
  B --> F[Mechanical]`;
            return <MermaidDiagram chart={pillarTriageChart} title="Pillar Triage" className="min-h-[280px]" />;
          })()}
        </section>

        {/* ADAPTIVE REPAIR MATRIX — highlights items matching the diagnosis */}
        {scalingData?.repairMatrix && (
          <AdaptiveRepairMatrix repairMatrix={scalingData.repairMatrix} />
        )}

        {/* Monetization Scaled Repair Difficulty Matrix */}
        {(scalingData?.repairs && scalingData.repairs.length > 0) && (
          <section className="mb-16" id="repair-monetization">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Repair Cost & Difficulty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {scalingData.repairs.map((r, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    {r.repair}
                  </h3>
                  <div className="flex flex-col gap-3 mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <p><span className="font-medium text-slate-500">Cause:</span> {r.cause}</p>
                    <p><span className="font-medium text-slate-500">Est. Cost:</span> <span className="font-black text-green-600 dark:text-green-400">${r.cost_low} – ${r.cost_high}</span></p>
                    
                    <div className="flex gap-2 mt-1">
                      <span className={`font-medium uppercase tracking-wider px-2 py-1 rounded text-[10px] w-fit ${
                        r.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                        r.difficulty === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30'
                      }`}>
                        {r.difficulty}
                      </span>
                      <span className={`font-medium uppercase tracking-wider px-2 py-1 rounded text-[10px] w-fit ${
                        r.urgency === 'low' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                        r.urgency === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        Urgency: {r.urgency}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <a href="#get-quote" className="text-hvac-blue dark:text-blue-400 font-semibold hover:underline flex items-center justify-between">
                        <span>Get a Quote</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </section>
        )}

        {/* 11. PARTS LIKELY INVOLVED — always 4 slots, DB rule-based + affiliate-ready */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Parts Likely Involved</h2>
          <ul className="space-y-3 list-none p-0">
            {normalizeComponents(components ?? []).map((comp: any, idx: number) => (
              <li key={idx}>
                <Link
                  href={comp.link ?? "#get-quote"}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:border-hvac-blue transition-colors"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">{comp.name}</span>
                  <span className="text-hvac-blue text-sm">{comp.link ? "View Component →" : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 13. TOOLS REQUIRED — conditionally render if valid */}
        {toolsRequired?.length >= 2 && (
          <section className="mb-16 w-full">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Tools You May Need</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              {normalizeTools(
                toolsRequired?.length > 0 ? toolsRequired : tools?.map((t: { name: string; description?: string; affiliateUrl?: string }) => ({ name: t.name, reason: t.description, description: t.description, affiliate_url: t.affiliateUrl ?? null, image_url: null })) ?? []
              ).map((tool: any, idx: number) => {
                const t = { ...tool, affiliateUrl: tool.affiliateUrl ?? tool.affiliate_url ?? null };
                return (
                  <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col">
                    <img
                      src={getImageSrc(t) || PLACEHOLDER_IMAGE}
                      alt={t.name}
                      className="w-full h-32 object-contain mb-3"
                    />
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
        )}

        {/* 13b. COMPONENTS FOR FIXES — always 4 slots, same UI everywhere */}
        <section className="mb-16 w-full">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Components for Fixes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {normalizeItems(vm.componentsForFixes ?? []).map((item: any, idx: number) => {
              const p = { ...item, proOnly: item.proOnly ?? false, affiliateUrl: item.affiliateUrl ?? null };
              return (
                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col relative">
                  {p.proOnly && (
                    <span className="absolute top-2 right-2 text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded">
                      Pro Only
                    </span>
                  )}
                  <img
                    src={getImageSrc(p) || PLACEHOLDER_IMAGE}
                    alt={p.name || "HVAC illustration"}
                    className="w-full h-32 object-contain mb-3"
                  />
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
          <AmazonDisclosure />
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
          const insights = technicianInsights.length >= 2
            ? technicianInsights.slice(0, 2).map((t: string | { text?: string; cite?: string }) => typeof t === "string" ? { text: t, cite: "Top Rated Local Techs" } : { text: (t as { text?: string }).text ?? String(t), cite: (t as { cite?: string }).cite ?? "Top Rated Local Techs" })
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
              {vm.costOfDelay ??
                "Running a failing system often leads to cascaded damage, increasing a $50 repair into a $2,500 compressor replacement."}
            </p>
          </div>
        </section>

        {/* 16. COMMON MISTAKES & 17. ENVIRONMENT CONDITIONS — with time estimates */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <section id="common-mistakes">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Common DIY Mistakes</h2>
            <ul className="space-y-4 list-none p-0">
              {(commonMistakes.length > 0 ? commonMistakes : [
                { name: "Running the system with ice on coils", description: "Turn off, let thaw. Running the compressor while frozen strains the motor.", time: "5–30 min to thaw" },
                { name: "Ignoring the filter", description: "Dirty filter is the #1 cause of airflow and cooling issues. Replace or clean monthly.", time: "5–15 min" },
                { name: "Handling refrigerant yourself", description: "EPA Section 608 requires certification. Venting or recharging without a license is illegal.", time: "Leave to pros" },
              ]).map((mistake: { name: string; description?: string; time?: string }, idx: number) => (
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
              {(environmentConditions.length > 0 ? environmentConditions : [
                { name: "Heavy use", description: "Extended runtime in hot weather increases wear on compressor and capacitor." },
                { name: "High humidity", description: "More condensate; drain lines and coils work harder." },
              ]).map((env: { name: string; description?: string }, idx: number) => (
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
              {(preventionTips.length > 0 ? preventionTips : [
                { name: "Filter maintenance", description: "Replace or clean monthly during heavy use" },
                { name: "Annual tune-up", description: "Schedule professional maintenance yearly" },
                { name: "Condenser care", description: "Clear debris from outdoor coil" },
              ]).map((tip: { name: string; description?: string }, idx: number) => (
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

        {/* 22. RELATED CAUSES & REPAIRS */}
        <section className="mb-16">
            <div>
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Conditions & Causes</h2>
              <div className="flex flex-wrap gap-3">
                {(scalingData?.relatedLinks?.causes || []).map((slug: string, idx: number) => (
                  <Link key={idx} href={`/diagnose/${slug}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-bold text-hvac-blue hover:border-hvac-blue hover:shadow transition-colors">
                    {slug.replace(/-/g, ' ')} →
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Repairs & Components</h2>
              <div className="flex flex-wrap gap-3">
                {[...(scalingData?.relatedLinks?.repairs || []), ...(scalingData?.relatedLinks?.components || [])].map((slug: string, idx: number) => (
                  <Link key={idx} href={`/repair/hvac/${slug}`} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors">
                    {slug.replace(/-/g, ' ')} →
                  </Link>
                ))}
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

        <ServiceCTA variant="final" />

        {/* 24. FAQ — minimum 4 items */}
        <section className="mb-16" id="faq">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 border-0">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {(() => {
              const baseFaq = faq?.length > 0 ? faq : fullCauses.map((c: any) => ({
                question: `Can a ${normalizeToString(c.name).toLowerCase()} cause ${normalizeToString(symptom.name).toLowerCase()}?`,
                answer: c.explanation,
              }));
              const defaultFaq = [
                { question: `Why is my ${normalizeToString(symptom.name).toLowerCase()}?`, answer: "Most often caused by restricted airflow (dirty filter), low refrigerant, or electrical issues. Check the filter first, then verify the outdoor unit is running." },
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

        {/* 14. SEO LINKS INJECTION */}
        {seoLinks && (Object.values(seoLinks.entity_connections || seoLinks).some((arr: any) => arr && arr.length > 0)) && (
          <section className="mb-16 w-full">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Explore Related Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              {(seoLinks.entity_connections?.related_symptoms || seoLinks.related_symptoms)?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">Symptoms</h3>
                  <ul className="space-y-2">
                    {(seoLinks.entity_connections?.related_symptoms || seoLinks.related_symptoms).map((l: any) => (
                      <li key={l.slug}>
                        <Link href={`/diagnose/${l.slug}`} className="text-hvac-blue hover:text-blue-700 font-medium text-sm transition-colors">{l.anchor}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(seoLinks.entity_connections?.related_causes || seoLinks.related_causes)?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">Causes</h3>
                  <ul className="space-y-2">
                    {(seoLinks.entity_connections?.related_causes || seoLinks.related_causes).map((l: any) => (
                      <li key={l.slug}>
                        <Link href={`/causes/${l.slug}`} className="text-hvac-blue hover:text-blue-700 font-medium text-sm transition-colors">{l.anchor}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(seoLinks.entity_connections?.related_repairs || seoLinks.related_repairs)?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">Repairs</h3>
                  <ul className="space-y-2">
                    {(seoLinks.entity_connections?.related_repairs || seoLinks.related_repairs).map((l: any) => (
                      <li key={l.slug}>
                        <Link href={`/fix/${l.slug}`} className="text-hvac-blue hover:text-blue-700 font-medium text-sm transition-colors">{l.anchor}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(seoLinks.entity_connections?.related_components || seoLinks.related_components)?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">Components</h3>
                  <ul className="space-y-2">
                    {(seoLinks.entity_connections?.related_components || seoLinks.related_components).map((l: any) => (
                      <li key={l.slug}>
                        <Link href={`/components/${l.slug}`} className="text-hvac-blue hover:text-blue-700 font-medium text-sm transition-colors">{l.anchor}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
