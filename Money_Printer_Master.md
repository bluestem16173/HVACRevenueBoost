# Money Printer Final Templates

## app/diagnose/[slug]/page.tsx
`	sx
import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getComponentsForPage } from "@/lib/components-for-page";
import { getToolsForPage } from "@/lib/tools-for-page";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import { buildLinksForPage } from "@/lib/link-engine";
import { normalizePageData } from "@/lib/content";
import SymptomPageTemplate from "@/templates/symptom-page";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const aiPage = await getDiagnosticPageFromDB(params.slug, 'diagnose') 
    ?? await getDiagnosticPageFromDB(params.slug, 'symptom')
    ?? await getDiagnosticPageFromDB(params.slug, 'condition');
  if (aiPage?.quality_status === 'noindex') {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export async function generateStaticParams() {
  return SYMPTOMS.map((s) => ({
    slug: s.id,
  }));
}

export default async function SymptomPage({ params }: { params: { slug: string } }) {
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  const aiPage = await getDiagnosticPageFromDB(params.slug, 'diagnose') 
    ?? await getDiagnosticPageFromDB(params.slug, 'symptom')
    ?? await getDiagnosticPageFromDB(params.slug, 'condition')
    ?? await getDiagnosticPageFromDB(params.slug, 'system');
  
  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  let rawContent: Record<string, unknown> | null = null;
  const pageContent = aiPage?.content_json ?? (aiPage as any)?.data;
  if (pageContent) {
    const raw = pageContent;
    rawContent = typeof raw === "string" ? (() => { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; } })() : (raw as Record<string, unknown>);
  }
  
  const qualityScore = aiPage?.quality_score ?? 100;

  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
  }

  if (!symptomData && rawContent) {
    const c = rawContent;
    const title = (c.title as string) ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const rankedCauses = (c.rankedCauses as any[]) ?? [];
    symptomData = {
      id: params.slug,
      name: title,
      slug: params.slug,
      description: (c.fastAnswer as string) ?? (c.problem_summary as string) ?? "",
      causes: rankedCauses.map((r: any) => (r || {}).slug ?? (r || {}).id ?? (r || {}).name).filter(Boolean),
    };
    isFromDB = false;
  }

  const symptom = symptomData as any;

  if (!symptom) {
    notFound();
  }

  const causeDetails = isFromDB
    ? (symptom.causes || [])
    : (symptom.causes || []).map((cId: string) => getCauseDetails(cId)).filter(Boolean);
  const causeIds = causeDetails.map((c: any) => (c || {}).slug || (c || {}).id);

  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const relatedContent = getRelatedContent(symptomData);
  const internalLinks = await getInternalLinksForPage(params.slug);
  const relatedLinks = await buildLinksForPage("symptom", `diagnose/${params.slug}`, { symptomId: params.slug });

  let tools: any[] = [];
  try {
    const dbTools = await getToolsForPage(params.slug);
    if (dbTools.length > 0) {
      tools = dbTools.map((t) => ({
        name: t.name,
        description: t.description,
        reason: t.description,
        affiliateUrl: t.affiliate_url ?? null,
        link: t.link,
      }));
    } else {
      const { getToolsFromDB } = require("@/lib/db");
      const generic = await getToolsFromDB();
      tools = (generic || []).map((t: any) => ({
        name: t.name,
        description: t.description,
        reason: t.description,
        affiliateUrl: t.affiliate_url ?? null,
      }));
    }
  } catch (e) {}

  const pageViewModel = normalizePageData({
    rawContent,
    pageType: "symptom",
    slug: params.slug,
    title: symptom.name,
    graphCauses: causeDetails,
  });

  let dbComponents: Array<{ name: string; slug: string; description?: string; link: string }> = [];
  try {
    dbComponents = await getComponentsForPage(params.slug);
  } catch (e) {}
  const mergedComponents = dbComponents.length > 0
    ? dbComponents.map((c) => ({ name: c.name, link: c.link, description: c.description }))
    : pageViewModel.components ?? [];

  const raw = rawContent as any;

  const FALLBACK_LINKS = {
    causes: ["low-refrigerant", "dirty-filter", "bad-capacitor"],
    repairs: ["replace-filter", "recharge-refrigerant", "replace-capacitor"],
    components: ["compressor", "evaporator-coil"]
  };

  const GENERIC_NARROW_DOWN = [
    "Check if the system is receiving power",
    "Verify airflow through vents or registers",
    "Listen for unusual noises from the unit",
    "Check thermostat settings and responsiveness",
    "Inspect for visible leaks, ice, or blockages"
  ];

  const GENERIC_REPAIRS = [
    { cause: "Dirty air filter", repair: "Replace air filter", cost_low: 10, cost_high: 40, difficulty: "Easy" },
    { cause: "Thermostat issue", repair: "Reset or replace thermostat", cost_low: 50, cost_high: 250, difficulty: "Moderate" },
    { cause: "Electrical fault", repair: "Inspect wiring or capacitor", cost_low: 150, cost_high: 400, difficulty: "Pro" },
    { cause: "Refrigerant issue", repair: "Recharge or repair leak", cost_low: 200, cost_high: 800, difficulty: "Pro" }
  ];

  function getField(rawObj: any, fieldName: string) {
    return rawObj?.content?.[fieldName] ?? rawObj?.[fieldName] ?? null;
  }

  const rawRepairs = getField(raw, 'repair_matrix') ?? getField(raw, 'repairs');
  const repairs = rawRepairs?.length >= 3 ? rawRepairs : GENERIC_REPAIRS;
  const narrowDownSteps = getField(raw, 'diagnostic_flow') ?? getField(raw, 'narrow_down') ?? GENERIC_NARROW_DOWN;

  const quickHackLinks = raw?.related || {
    causes: (raw?.causes || []).slice(0, 3).map((c: any) => c?.slug || c?.id || c?.name || c),
    repairs: (raw?.repairs || []).slice(0, 3).map((r: any) => r?.slug || r?.id || r?.name || r),
    components: (mergedComponents || []).slice(0, 2).map((c: any) => c?.slug || c?.link || c?.name)
  };

  const finalRelatedLinks = {
    causes: quickHackLinks.causes?.length >= 3 ? quickHackLinks.causes : FALLBACK_LINKS.causes,
    repairs: quickHackLinks.repairs?.length >= 3 ? quickHackLinks.repairs : FALLBACK_LINKS.repairs,
    components: quickHackLinks.components?.length >= 2 ? quickHackLinks.components : FALLBACK_LINKS.components,
  };

  const relObj = raw?.relationships || {};
  const allRelSlugs = [
    ...(relObj.system || []),
    ...(relObj.symptoms || []),
    ...(relObj.diagnostics || []),
    ...(relObj.causes || []),
    ...(relObj.components || []),
    ...(relObj.context || []),
    ...(relObj.repairs || []),
  ];
  const { getRelatedPagesBySlugs } = require("@/lib/db");
  const relatedGraphPages = await getRelatedPagesBySlugs(aiPage?.site || "hvac", Array.from(new Set(allRelSlugs)));

  const rawSystemExp = getField(raw, 'system_explanation');
  
  const ctaField = getField(raw, 'cta') || getField(raw, 'primaryCTA');

  const scalingData = {
    narrowDownSteps,
    systemExplanation: rawSystemExp?.length >= 4 
      ? rawSystemExp 
      : [
          "Thermostat signals the system to begin cooling.",
          "Indoor unit absorbs heat from air.",
          "Outdoor unit releases collected heat.",
          "Cycle repeats until set temperature is reached.",
        ],
    repairs,
    relatedLinks: finalRelatedLinks,
    decisionTree: getField(raw, 'decision_tree') ?? pageViewModel.decisionTree ?? getField(raw, 'mermaidGraph') ?? null,
    subtitle: getField(raw, 'subtitle') ?? getField(raw, 'hero')?.subheadline ?? null,
    diagnosticFlow: getField(raw, 'diagnostic_flow') ?? getField(raw, 'diagnosticFlow') ?? narrowDownSteps,
    quickTools: getField(raw, 'quick_tools') ?? getField(raw, 'quickTools') ?? null,
    clusterNav: getField(raw, 'cluster_nav') ?? null,
    topCauses: getField(raw, 'top_causes') ?? getField(raw, 'topCauses') ?? null,
    techObservation: getField(raw, 'tech_observation') ?? getField(raw, 'hero')?.expectationSetting ?? null,
    primaryCTA: ctaField ? {
      headline: ctaField.primaryText || ctaField.headline || ctaField.primary || "Need Professional Help?",
      subtext: ctaField.secondaryText || ctaField.subtext || "Our certified technicians can diagnose and fix this guaranteed.",
      buttonText: "Local Techs Coming Soon",
      url: "#"
    } : undefined,
  };


  return (
    <SymptomPageTemplate
      symptom={symptom}
      qualityScore={qualityScore}
      pageViewModel={{ ...pageViewModel, components: mergedComponents }}
      causeIds={causeIds}
      causeDetails={causeDetails}
      diagnosticSteps={diagnosticSteps}
      relatedContent={relatedContent}
      internalLinks={internalLinks}
      relatedLinks={relatedLinks}
      seoLinks={pageContent?.seo_links || pageContent?.seoLinks}
      tools={tools}
      getCauseDetails={getCauseDetails}
      scalingData={scalingData}
      relatedGraphPages={relatedGraphPages}
    />
  );
}

`

## templates/symptom-page.tsx
`	sx
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
import AdaptiveRepairMatrix from "@/components/AdaptiveRepairMatrix";
import RelationshipGraph from "@/components/RelationshipGraph";
import { RelatedLinks } from "@/components/graph/RelatedLinks";

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
  scalingData,
  relatedGraphPages
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
    primaryCTA?: {
      headline: string;
      subtext: string;
      buttonText: string;
      url: string;
    };
  };
  relatedGraphPages?: any[];
}) {
  // Resolve causes from DB or static KG
  if (!scalingData?.decisionTree) {
    console.error("Missing decision tree for:", symptom.id);
  }

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

  const safeArr = (v: any) => Array.isArray(v) ? v : [];
  const allSeoLinks = [
    ...safeArr(seoLinks?.entity_connections?.related_symptoms || seoLinks?.related_symptoms),
    ...safeArr(seoLinks?.entity_connections?.related_causes || seoLinks?.related_causes),
    ...safeArr(seoLinks?.entity_connections?.related_repairs || seoLinks?.related_repairs),
    ...safeArr(seoLinks?.entity_connections?.related_components || seoLinks?.related_components)
  ].filter((l: any) => l && l.anchor && l.path);

  let fastAnswerHtml = fastAnswerText;
  if (seoLinks?.contextual_links?.quick_answer) {
    fastAnswerHtml = injectLinks(fastAnswerText, seoLinks.contextual_links.quick_answer, 1);
  } else if (allSeoLinks.length > 0) {
    fastAnswerHtml = injectLinks(fastAnswerText, allSeoLinks, 2);
  }

  let descriptionHtml = symptom.description || "";
  if (seoLinks?.contextual_links?.short_explanation) {
    descriptionHtml = injectLinks(descriptionHtml, seoLinks.contextual_links.short_explanation, 1);
  } else if (allSeoLinks.length > 0) {
    descriptionHtml = injectLinks(descriptionHtml, allSeoLinks, 2);
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

  const checklist = Array.isArray(vm.checklist) && vm.checklist.length > 0 ? vm.checklist : [
    "Verify thermostat is set to cool and set below room temperature",
    "Replace dirty air filter — a clogged filter is the #1 cause of reduced airflow",
    "Reset the HVAC breaker at the panel and wait 30 seconds before restarting",
    "Check outdoor condenser coil for debris, ice, or blockage",
  ];

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
              return (
                <SystemOverviewBlock 
                  key="system_overview" 
                  variant="symptom" 
                  systemExplanation={scalingData?.systemExplanation} 
                />
              );
            }
            if (sectionKey === "conditional_diagram") {
              return <ConditionalDiagram key="conditional_diagram" symptomSlug={symptom.id} />;
            }
            if (sectionKey === "diagnostic_flow" || sectionKey === "adaptive_diagnostic_panel") {
              return (
                <AdaptiveDiagnosticPanel
                  key="adaptive_diagnostic"
                  decisionTree={scalingData?.decisionTree ?? null}
                  diagnosticFlow={(scalingData?.diagnosticFlow || []).map((step: any) => ({
                    ...step,
                    interpretation: injectLinks(step.interpretation, allSeoLinks, 1),
                    field_insight: injectLinks(step.field_insight, allSeoLinks, 1),
                  }))}
                  slug={symptom.id}
                />
              );
            }
            const Component = SECTION_MAP[sectionKey];
            const data = sectionsObj[sectionKey];
            if (!Component || data === undefined || data === null) return null;
            return (
              <React.Fragment key={sectionKey}>
                <Component
                  data={data}
                  symptomName={sectionKey === "hero" ? symptom.name : undefined}
                />
                {/* INJECT CTA DIRECTLY AFTER HERO IN CANARY LAYOUT */}
                {sectionKey === "hero" && scalingData?.primaryCTA && (
                  <section className="cta-primary mt-8 mb-12 bg-hvac-blue dark:bg-hvac-navy p-8 rounded-2xl shadow-xl border border-hvac-blue/20 text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 opacity-50 z-0"></div>
                     <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                       <h2 className="text-3xl font-black text-white mb-3 leading-tight">{scalingData.primaryCTA.headline}</h2>
                       <p className="text-blue-100 mb-6 text-lg font-medium">{scalingData.primaryCTA.subtext}</p>
                       <a href={(scalingData.primaryCTA.url || "").replace("{{GHL_CTA_URL}}", process.env.NEXT_PUBLIC_GHL_URL || "/get-quote")} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center bg-hvac-gold hover:bg-yellow-400 text-hvac-navy font-black py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-xl uppercase tracking-widest">
                         <span>{scalingData.primaryCTA.buttonText}</span>
                         <AlertTriangle className="w-5 h-5 ml-2" />
                       </a>
                     </div>
                  </section>
                )}
              </React.Fragment>
            );
          })}

          {/* FORCED KEY COMPONENTS (Even if layout breaks) */}
          {/* <AdaptiveNarrowPanel rankedCauses={scalingData?.rankedCauses} /> (To be implemented) */}
          {scalingData?.repairMatrix && (
            <AdaptiveRepairMatrix repairMatrix={scalingData.repairMatrix} />
          )}
          <AdaptiveDiagnosticPanel
            decisionTree={scalingData?.decisionTree}
            diagnosticFlow={scalingData?.diagnosticFlow ?? []}
            slug={symptom.id}
          />
        </div>
      </div>
    );
  }

  // --- Phase 44: Deep Diagnostic 11-Block Format ---
  const isPhase44DeepDiagnostic = !!(vm.causesData && vm.fixesData && vm.hero);
  if (isPhase44DeepDiagnostic) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

          {/* BREADCRUMBS */}
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

          {/* 1. HERO */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4 text-sm font-bold text-hvac-blue bg-hvac-blue/10 w-fit px-3 py-1.5 rounded-full border border-hvac-blue/30">
              <span className="text-green-600 dark:text-green-400">✔</span> Reviewed by Certified HVAC Technicians
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight m-0">
              {symptom.name}: Diagnostic & Repair Guide
            </h1>
            {vm.hero?.problemStatement && (
              <p className="mt-6 text-gray-600 dark:text-slate-400 text-lg leading-relaxed font-semibold">
                {vm.hero.problemStatement}
              </p>
            )}
            {vm.hero?.immediateInstruction && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl">
                <p className="text-red-800 dark:text-red-200 font-bold m-0 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> 
                  IMMEDIATE ACTION: {vm.hero.immediateInstruction}
                </p>
              </div>
            )}
            {vm.hero?.expectationSetting && (
              <p className="mt-4 text-slate-500 dark:text-slate-500 italic">
                {vm.hero.expectationSetting}
              </p>
            )}
          </section>

          {/* 2. QUICK ANSWER */}
          {vm.quickAnswersData && vm.quickAnswersData.length > 0 && (
            <section className="mb-12 bg-hvac-blue/5 dark:bg-hvac-blue/10 p-8 rounded-2xl border border-hvac-blue/20">
              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Quick Answer (Do This First)
              </h2>
              <ul className="space-y-3">
                {vm.quickAnswersData.map((ans: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-green-600 dark:text-green-400 mt-1">✔</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{ans}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. DIAGNOSTIC FLOW */}
          {vm.diagnosticFlowData && vm.diagnosticFlowData.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Diagnostic Flow Logic
              </h2>
              <div className="space-y-4">
                {vm.diagnosticFlowData.map((step, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-hvac-blue text-white font-black text-xl rounded-full shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{step.step}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{step.logic}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center shrink-0 sm:w-1/3">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Next Action</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">{step.nextAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. ROOT CAUSES */}
          {vm.causesData && vm.causesData.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Proven Root Causes
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {vm.causesData.map((c, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className={`p-4 ${
                      c.severity?.toLowerCase() === 'high' ? 'bg-red-50 border-b border-red-100 dark:bg-red-900/20 dark:border-red-900/30' : 
                      c.severity?.toLowerCase() === 'medium' ? 'bg-amber-50 border-b border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30' : 
                      'bg-green-50 border-b border-green-100 dark:bg-green-900/20 dark:border-green-900/30'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Cause #{i+1}</span>
                        <div className="flex gap-2 text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/50 dark:bg-black/20">
                          <span className={c.severity?.toLowerCase() === 'high' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                            Severity: {c.severity}
                          </span>
                          <span>|</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            Likelihood: {c.likelihood}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{c.whatItIs}</h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <strong className="block text-sm text-slate-500 uppercase tracking-wider mb-1">Why It Happens</strong>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">{c.whyItHappens}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <strong className="block text-xs text-slate-500 uppercase tracking-wider mb-1">How To Confirm</strong>
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm m-0">{c.howToConfirm}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. FIXES */}
          {vm.fixesData && vm.fixesData.length > 0 && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Step-by-Step Fixes
              </h2>
              <div className="space-y-8">
                {vm.fixesData.map((f, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                      <h3 className="text-2xl font-bold text-hvac-navy dark:text-white m-0">{f.fixName}</h3>
                      <div className="flex flex-wrap gap-3">
                        {f.difficultyLevel && (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-200 dark:border-slate-700">
                            Level: {f.difficultyLevel}
                          </span>
                        )}
                        {f.timeEstimate && (
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-200 dark:border-slate-700">
                            Time: {f.timeEstimate}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {f.whenNotToDiy && (
                      <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <strong className="text-amber-800 dark:text-amber-200 text-sm font-bold block mb-1">⚠️ WHEN NOT TO DIY</strong>
                        <p className="text-amber-900 dark:text-amber-100 text-sm m-0">{f.whenNotToDiy}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Execution Steps</h4>
                        <ul className="space-y-4">
                          {f.exactSteps?.map((step: string, j: number) => (
                            <li key={j} className="flex gap-3">
                              <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs shrink-0 mt-0.5">{j+1}</span>
                              <span className="text-slate-700 dark:text-slate-300 text-sm">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {f.toolsRequired && f.toolsRequired.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 h-fit">
                          <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Tools Required</h4>
                          <ul className="space-y-2">
                            {f.toolsRequired.map((tool: string, j: number) => (
                              <li key={j} className="flex items-center gap-2">
                                <span className="text-hvac-gold">🔧</span>
                                <span className="text-slate-800 dark:text-slate-200 text-sm font-medium">{tool}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. COST BREAKDOWN */}
          {vm.costBreakdown && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Cost Breakdown
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Repair Cost Ranges</span>
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">{vm.costBreakdown.repairCostRanges}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">DIY vs Professional</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{vm.costBreakdown.diyVsProfessional}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="block text-sm text-slate-800 dark:text-slate-200 mb-1">What Affects Price?</strong>
                  <p className="text-sm text-slate-600 dark:text-slate-400 m-0">{vm.costBreakdown.whatAffectsPrice}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-200 dark:border-red-900/30">
                  <strong className="block text-sm text-red-800 dark:text-red-300 mb-1">When Costs Spike</strong>
                  <p className="text-sm text-red-700 dark:text-red-400 m-0">{vm.costBreakdown.whenCostSpikes}</p>
                </div>
              </div>
            </section>
          )}

          {/* 7. PREVENTION */}
          {vm.preventionData && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Prevention & Long-Term Health
              </h2>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-hvac-blue transition-colors">
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-6 leading-relaxed">
                  {vm.preventionData.howToAvoidLongTerm}
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <strong className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Maintenance Habits</strong>
                    <ul className="space-y-2">
                      {vm.preventionData.maintenanceHabits?.map((habit: string, i: number) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-green-500 mt-0.5">✔</span>
                          <span className="text-slate-600 dark:text-slate-400 text-sm">{habit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <strong className="block text-sm font-black uppercase tracking-widest text-hvac-blue dark:text-blue-300 mb-2">System Upgrades</strong>
                    <p className="text-sm text-blue-900 dark:text-blue-200 m-0">{vm.preventionData.systemUpgrades}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 8. WARNING SIGNS */}
          {vm.warningSigns && (
            <section className="mb-12">
              <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                Early Warning Signs
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <strong className="block text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Symptoms Before Failure</strong>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {vm.warningSigns.symptomsBeforeFailure?.map((sym: string, i: number) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-amber-500 mt-0.5">⚠</span>
                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <strong className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">What Users Miss</strong>
                    <p className="text-sm text-slate-600 dark:text-slate-400 m-0">{vm.warningSigns.whatUsersMiss}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/30 shadow-sm">
                    <strong className="block text-xs font-black uppercase tracking-widest text-red-400 mb-1">Escalation Pattern</strong>
                    <p className="text-sm text-slate-600 dark:text-slate-400 m-0">{vm.warningSigns.escalationPatterns}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 9. CTA */}
          {vm.cta && (
            <section className="mb-12 bg-hvac-navy p-8 rounded-2xl shadow-xl text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-hvac-blue to-cyan-500 opacity-20 group-hover:opacity-30 transition-opacity z-0"></div>
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-3xl font-black text-white mb-3">Professional Service Recommended</h2>
                <p className="text-blue-100 mb-6 text-lg max-w-2xl">{vm.cta.primary}</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <a href={process.env.NEXT_PUBLIC_GHL_URL || "/get-quote"} className="bg-hvac-gold hover:bg-yellow-400 text-hvac-navy font-black py-4 px-8 rounded-full text-lg shadow-lg uppercase tracking-widest transition-transform hover:scale-105">
                    {vm.cta.urgency || "Get Help Now"}
                  </a>
                  <a href="/about" className="bg-white/10 hover:bg-white/20 text-white font-black py-4 px-8 rounded-full text-lg transition-colors border border-white/20">
                    {vm.cta.secondary || "Talk to an Expert"}
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* 11. FAQ */}
          {vm.faq && vm.faq.length > 0 && (
            <section className="mb-12">
               <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                  Frequently Asked Questions
               </h2>
               <div className="space-y-4">
                 {vm.faq.map((q, i) => (
                   <details key={i} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                     <summary className="cursor-pointer p-5 font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       {q.question}
                       <span className="transition group-open:rotate-180">
                         <ChevronDown className="w-5 h-5 text-slate-400" />
                       </span>
                     </summary>
                     <div className="p-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 mt-2">
                       {q.answer}
                     </div>
                   </details>
                 ))}
               </div>
            </section>
          )}

          {/* AI Relationships Graph Block */}
          <RelationshipGraph 
            relationships={vm.relationships} 
            currentPageType={vm.pageType} 
            currentSlug={vm.slug} 
          />

          {/* 10. INTERNAL LINKS */}
          {vm.internalLinksData && vm.internalLinksData.length > 0 && (
            <section className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Related Diagnostic Guides</p>
               <div className="flex flex-wrap gap-2">
                 {vm.internalLinksData.map((linkText: string, i: number) => {
                   // Ensure it looks like a clean anchor
                   const isUrl = String(linkText).includes('/') || String(linkText).includes('.com');
                   const label = isUrl ? (String(linkText).split('/').pop()?.replace(/-/g, ' ') || linkText) : linkText;
                   return (
                     <a key={i} href="#" className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:bg-hvac-blue hover:text-white transition-colors">
                       {label}
                     </a>
                   );
                 })}
               </div>
            </section>
          )}
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

        {/* PRIMARY CTA (ABOVE THE FOLD) 🔥 */}
        {scalingData?.primaryCTA && (
          <section className="cta-primary mb-12 bg-hvac-blue dark:bg-hvac-navy p-8 rounded-2xl shadow-xl border border-hvac-blue/20 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 opacity-50 z-0"></div>
             <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
               <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                 {scalingData.primaryCTA.headline}
               </h2>
               <p className="text-blue-100 mb-6 text-lg font-medium">
                 {scalingData.primaryCTA.subtext}
               </p>
               <a 
                 href={(scalingData.primaryCTA.url || "").replace("{{GHL_CTA_URL}}", process.env.NEXT_PUBLIC_GHL_URL || "/get-quote")} 
                 className="btn-primary w-full sm:w-auto inline-flex items-center justify-center bg-hvac-gold hover:bg-yellow-400 text-hvac-navy font-black py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-xl uppercase tracking-widest"
               >
                 <span>{scalingData.primaryCTA.buttonText}</span>
                 <AlertTriangle className="w-5 h-5 ml-2" />
               </a>
             </div>
          </section>
        )}

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
          diagnosticFlow={(scalingData?.diagnosticFlow || []).map((step: any) => ({
            ...step,
            interpretation: injectLinks(step.interpretation, allSeoLinks, 1),
            field_insight: injectLinks(step.field_insight, allSeoLinks, 1),
          }))}
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



        {/* 1. DIY VS PRO PILLARS */}
        <section className="mb-12" id="diy-vs-pro">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">DIY vs Professional Categories</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Only clogged air filter is DIY-friendly. Electrical, chemical, and mechanical work require a professional.</p>
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
            Mechanical: { name: "System Age & Prevention", why: "Older systems face R-22 phase-outs and mechanical wear. Consider static pressure tests or upgrading to modern variable-speed tech." },
          };
          const onePerPillar = pillarOrder.map((p) => {
            if (p === "Mechanical") return { name: "System Age & Prevention", why: "Older systems face R-22 regulatory phase-outs and mechanical wear. Consider a static pressure test or upgrading to modern variable-speed technologies." };
            return byPillar[p]?.[0] ?? placeholders[p];
          });
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
                          description={injectLinks((cause as any).why ?? (cause as any).explanation ?? "", allSeoLinks, 1)}
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
            if (slug === "mechanical") {
              return [
                { issue: "System Age (10+ Years)", explanation: "Efficiency drops significantly; consider replacement vs repair economics", diy_pro: "Pro" },
                { issue: "Regulatory Changes", explanation: "R-22 refrigerant phase-out makes legacy system repairs extremely expensive", diy_pro: "Pro" },
                { issue: "New Technologies", explanation: "Modern variable-speed air handlers offer massive energy savings", diy_pro: "Pro" },
                { issue: "Air Handler Test", explanation: "Recommend full load calculation & static pressure test for persistent issues", diy_pro: "Pro" },
              ];
            }
            const fromPb = pb[slug] ?? pb[slug === "structural" ? "ducting_airflow" : slug === "chemical" ? "refrigeration" : slug];
            if (fromPb && fromPb.length > 0) return fromPb.slice(0, 5).map((x: any) => ({ issue: x.issue ?? x.explanation, explanation: x.explanation, warning: x.warning, diy_pro: x.diy_pro ?? "Pro" }));
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

        {/* AI Relationships Graph Block */}
        <RelationshipGraph 
          relationships={vm.relationships} 
          currentPageType={vm.pageType} 
          currentSlug={vm.slug} 
        />

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

        {/* 9. THE TOOLKIT */}
        {(vm.toolkit || toolsRequired?.length >= 2) && (
          <section className="mb-16 w-full" id="toolkit">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Diagnostic Toolkit</h2>
            {vm.toolkit && vm.toolkit.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vm.toolkit.map((t: any, idx: number) => (
                  <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col shadow-sm hover:border-hvac-gold transition-colors">
                    <div className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">{t.tool}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex-1 space-y-2">
                       <p><strong>Why:</strong> {t.why}</p>
                       <p><strong>When:</strong> {t.when}</p>
                    </div>
                    <a href={`https://www.amazon.com/s?k=${encodeURIComponent("HVAC " + t.tool)}&tag=hvacrevenue-20`} target="_blank" rel="noopener noreferrer" className="mt-4 text-xs font-bold text-hvac-blue hover:underline uppercase tracking-widest block">
                      View on Amazon →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
            
            {/* 10. TOOL COMPARISON GRID */}
            {vm.toolComparison && vm.toolComparison.length > 0 && (
               <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                     <tr>
                       <th className="p-4 font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase text-xs">Tool</th>
                       <th className="p-4 font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase text-xs">Use Case</th>
                       <th className="p-4 font-black tracking-widest text-slate-600 dark:text-slate-400 uppercase text-xs">Skill Level</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {vm.toolComparison.map((tc: any, i: number) => (
                       <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{tc.tool}</td>
                         <td className="p-4 text-slate-600 dark:text-slate-400">{tc.useCase}</td>
                         <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold tracking-widest uppercase ${
                              String(tc.skillLevel).toLowerCase().includes('pro') ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 
                              String(tc.skillLevel).toLowerCase().includes('easy') ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                            }`}>
                              {tc.skillLevel}
                            </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
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

        {/* 11. COST ANALYSIS */}
        <section className="mb-16" id="cost">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Typical Repair Costs</h2>
          
          {vm.costAnalysis ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-hvac-blue/20 p-6 rounded-2xl flex flex-col justify-between">
                   <div>
                     <h3 className="text-sm font-black text-hvac-blue dark:text-blue-400 uppercase tracking-widest mb-3">Repair Cost</h3>
                     <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{vm.costAnalysis.repair}</p>
                   </div>
                   <button disabled className="mt-6 text-sm font-bold text-slate-500 cursor-not-allowed uppercase tracking-widest text-left">Local Techs Coming Soon</button>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-hvac-safety/30 p-6 rounded-2xl flex flex-col justify-between">
                   <div>
                     <h3 className="text-sm font-black text-hvac-safety dark:text-red-400 uppercase tracking-widest mb-3">Replacement Reality</h3>
                     <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{vm.costAnalysis.replace}</p>
                   </div>
                   <button disabled className="mt-6 text-sm font-bold text-slate-500 cursor-not-allowed uppercase tracking-widest text-left">Local Techs Coming Soon</button>
                </div>
             </div>
          ) : (
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
                <button disabled className="mt-4 text-sm font-bold text-slate-500 cursor-not-allowed">Local Techs Coming Soon</button>
              </div>
              {/* Red: Professional */}
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-hvac-safety/50 p-6 rounded-xl">
                <h3 className="text-sm font-black text-red-800 dark:text-red-200 uppercase tracking-widest mb-2">Professional</h3>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-200 m-0">$450+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Refrigerant, compressor, electrical.</p>
                <button disabled className="mt-4 bg-slate-600 text-slate-300 font-black px-6 py-3 rounded-xl uppercase tracking-widest text-sm cursor-not-allowed">
                  Local Techs Coming Soon
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 12. ADVANCED INSIGHTS (Technician Insights) */}
        {vm.advancedInsights ? (
          <section className="mb-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm">
            <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-6">Advanced Diagnostics & Edge Cases</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-t-4 border-t-amber-400">
                <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wide text-xs">Voltage & Sensors</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{vm.advancedInsights.voltage}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-t-4 border-t-hvac-blue">
                <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wide text-xs">Environmental Factors</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{vm.advancedInsights.environment}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-t-4 border-t-red-400">
                <h4 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wide text-xs">Failure Patterns</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{vm.advancedInsights.patterns}</p>
              </div>
            </div>
          </section>
        ) : (() => {
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

        {/* 13. PREVENTION SYSTEM */}
        <section className="mb-16" id="prevention">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Prevention Strategy</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium italic">
            An ounce of prevention is worth a pound of cure. Preventative maintenance effectively neutralizes the most expensive failure risks.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
            {vm.prevention && vm.prevention.length > 0 ? (
                <ul className="space-y-4 m-0 p-0 list-none">
                  {vm.prevention.map((tip: string, idx: number) => (
                    <li key={idx} className="flex gap-4">
                      <div className="w-8 h-8 shrink-0 bg-hvac-blue/10 text-hvac-blue rounded-full flex items-center justify-center font-black">
                        {idx + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
            ) : (
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
            )}
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
              disabled
              className="mt-8 bg-slate-600 text-slate-300 font-black px-8 py-4 rounded-xl uppercase text-sm block md:inline-block shadow-inner cursor-not-allowed"
            >
              Local Techs Coming Soon
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

        {/* 22. RELATED CAUSES & REPAIRS (INTENT-BASED GROUPING) */}
        <section className="mb-16 mt-8">
          <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-6">Related Problems & Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Related Symptoms */}
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                <span>🔄</span> Related Symptoms
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const rawItems = seoLinks?.entity_connections?.related_symptoms || seoLinks?.related_symptoms;
                  const items = Array.isArray(rawItems) ? rawItems : [];
                  const fallback = relatedContent?.relatedSymptoms || [];
                  const links = items.length > 0
                    ? items.map((l: any) => {
                        if (typeof l === 'string') return { href: `/diagnose/${l}`, label: l.replace(/-/g, ' ') };
                        return { href: l.path || `/diagnose/${l.slug}`, label: l.anchor || l.slug?.replace(/-/g, ' ') || l.name || "" };
                      })
                    : fallback.map((s: any) => ({ href: `/diagnose/${s.id}`, label: s.name }));
                  
                  return (links.length > 0 ? links : [
                    { href: "/diagnose/ac-not-cooling", label: "ac not cooling" },
                    { href: "/diagnose/ac-blowing-warm-air", label: "ac blowing warm air" },
                    { href: "/diagnose/ac-freezing-up", label: "ac freezing up" }
                  ]).slice(0, 5).map((l: any, i: number) => (
                    <li key={i}>
                      <Link href={l.href} className="text-hvac-blue hover:text-blue-700 font-bold text-sm transition-colors hover:underline capitalize">
                        {l.label}
                      </Link>
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Column 2: Likely Causes */}
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                <span>🔍</span> Common Causes
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const rawItems = seoLinks?.entity_connections?.related_causes || seoLinks?.related_causes;
                  const items = Array.isArray(rawItems) ? rawItems : [];
                  const fallback = scalingData?.relatedLinks?.causes || [];
                  const links = items.length > 0
                    ? items.map((l: any) => {
                        if (typeof l === 'string') return { href: `/cause/${l}`, label: l.replace(/-/g, ' ') };
                        return { href: l.path || `/cause/${l.slug}`, label: l.anchor || l.slug?.replace(/-/g, ' ') || l.name || "" };
                      })
                    : fallback.map((slug: string) => ({ href: `/cause/${slug}`, label: slug.replace(/-/g, ' ') }));
                  
                  return (links.length > 0 ? links : [
                    { href: "/cause/low-refrigerant", label: "low refrigerant" },
                    { href: "/cause/dirty-evaporator-coil", label: "dirty evaporator coil" },
                    { href: "/cause/bad-capacitor", label: "bad capacitor" }
                  ]).slice(0, 5).map((l: any, i: number) => (
                    <li key={i}>
                      <Link href={l.href} className="text-hvac-blue hover:text-blue-700 font-bold text-sm transition-colors hover:underline capitalize">
                        {l.label}
                      </Link>
                    </li>
                  ));
                })()}
              </ul>
            </div>

            {/* Column 3: Fixes & Next Steps */}
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                <span>🔧</span> Fixes & Next Steps
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const rawItems = seoLinks?.entity_connections?.related_repairs || seoLinks?.related_repairs;
                  const items = Array.isArray(rawItems) ? rawItems : [];
                  const fallback = scalingData?.relatedLinks?.repairs || [];
                  const links = items.length > 0
                    ? items.map((l: any) => {
                        if (typeof l === 'string') return { href: `/fix/${l}`, label: l.replace(/-/g, ' ') };
                        return { href: l.path || `/fix/${l.slug}`, label: l.anchor || l.slug?.replace(/-/g, ' ') || l.name || "" };
                      })
                    : fallback.map((slug: string) => ({ href: `/fix/${slug}`, label: slug.replace(/-/g, ' ') }));
                  
                  return (links.length > 0 ? links : [
                    { href: "/fix/recharge-refrigerant", label: "recharge refrigerant" },
                    { href: "/fix/replace-capacitor", label: "replace capacitor" },
                    { href: "/fix/unclog-drain-line", label: "unclog drain line" }
                  ]).slice(0, 5).map((l: any, i: number) => (
                    <li key={i}>
                      <Link href={l.href} className="text-hvac-blue hover:text-blue-700 font-bold text-sm transition-colors hover:underline capitalize">
                        {l.label}
                      </Link>
                    </li>
                  ));
                })()}
              </ul>
            </div>

          </div>
        </section>

        {/* 23. LOCAL SERVICE CTA — hvac-navy + hvac-gold */}
        <section className="mb-16" id="get-quote">
          <div className="bg-hvac-navy text-white p-10 md:p-14 rounded-3xl relative overflow-hidden shadow-2xl text-center">
            <div className="absolute inset-0 bg-hvac-blue opacity-20 blur-3xl rounded-full scale-150"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black m-0 mb-6 border-0 text-white">
                Local Techs Coming Soon
              </h2>
              <p className="text-slate-300 text-lg md:text-xl mb-8">
                Stop guessing and risking a $2,500 compressor failure. Connect with licensed technicians to fix your cooling immediately.
              </p>
              <button
                disabled
                className="bg-slate-600 text-slate-300 font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-lg shadow-inner cursor-not-allowed w-full sm:w-auto mt-4"
              >
                Local Techs Coming Soon
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

        {/* 14. DYNAMIC GRAPH LINKS INJECTION */}
        {relatedGraphPages && relatedGraphPages.length > 0 && (
          <section className="mb-16 w-full">
            <h2 className="text-3xl font-black text-hvac-navy dark:text-white mb-8 border-0">Diagnose Further</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <RelatedLinks title="Related Systems" items={relatedGraphPages.filter((p: any) => p.page_type === 'system')} />
              <RelatedLinks title="Related Symptoms" items={relatedGraphPages.filter((p: any) => p.page_type === 'symptom')} />
              <RelatedLinks title="Diagnostic Guides" items={relatedGraphPages.filter((p: any) => ["diagnostic", "condition"].includes(p.page_type))} />
              <RelatedLinks title="Possible Causes" items={relatedGraphPages.filter((p: any) => p.page_type === 'cause')} />
              <RelatedLinks title="Recommended Repairs" items={relatedGraphPages.filter((p: any) => p.page_type === 'repair')} />
              <RelatedLinks title="Parts & Components" items={relatedGraphPages.filter((p: any) => p.page_type === 'component')} />
              <RelatedLinks title="Specific Contexts" items={relatedGraphPages.filter((p: any) => p.page_type === 'context')} />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

`

## components/AdaptiveDiagnosticPanel.tsx
`	sx
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const DecisionTree = dynamic(() => import("@/components/DecisionTree"), { ssr: false });
const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

interface DiagnosticStep {
  step: number;
  title?: string;
  question?: string;
  actions?: string[];
  yes?: string | { action: string; next_step?: number; likely_cause?: string };
  no?: string | { action: string; next_step?: number; likely_cause?: string };
  interpretation?: string;
  field_insight?: string;
  related_causes?: string[];
}

interface Props {
  decisionTree: any;
  diagnosticFlow: DiagnosticStep[];
  slug: string;
}

export default function AdaptiveDiagnosticPanel({ decisionTree, diagnosticFlow, slug }: Props) {
  const [activeCauseId, setActiveCauseId] = useState<string>("");
  const resultRef = useRef<HTMLDivElement>(null);

  // ① AUTO-SCROLL: When cause is identified → scroll result into view
  useEffect(() => {
    if (activeCauseId && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120); // small delay lets the result card render fully first
    }
  }, [activeCauseId]);

  // ② BROADCAST cause ID via custom event so AdaptiveRepairMatrix can react
  const handleCauseIdentified = (causeId: string) => {
    setActiveCauseId(causeId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hvac-cause-identified", { detail: causeId })
      );
    }
  };

  const hasFlow = Array.isArray(diagnosticFlow) && diagnosticFlow.length > 0;

  // ③ SPLIT FLOW into Recommended (matches cause) + Additional Checks
  const recommendedSteps = hasFlow && activeCauseId
    ? diagnosticFlow.filter(s => s.related_causes?.includes(activeCauseId))
    : [];
  const additionalSteps = hasFlow
    ? activeCauseId
      ? diagnosticFlow.filter(s => !s.related_causes?.includes(activeCauseId))
      : diagnosticFlow
    : [];

  const renderStep = (step: DiagnosticStep, i: number, isRecommended: boolean) => (
    <div
      key={`${step.step}-${i}`}
      className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
        isRecommended
          ? "ring-2 ring-hvac-gold scale-[1.01] border border-hvac-gold bg-white dark:bg-slate-900"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
      }`}
    >
      {/* Step header */}
      <div
        className={`flex items-center gap-3 px-5 py-3 transition-colors duration-300 ${
          isRecommended ? "bg-amber-50 dark:bg-amber-900/20 border-b border-hvac-gold/30" : "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"
        }`}
      >
        <span
          className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-sm shrink-0 ${
            isRecommended ? "bg-hvac-gold text-hvac-navy" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          {step.step ?? i + 1}
        </span>
        <span
          className={`font-bold text-base tracking-wide ${
            isRecommended ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {step.title || step.question}
          {isRecommended && (
            <span className="ml-2 text-xs font-black uppercase tracking-widest text-hvac-gold opacity-90">
              ← Likely Match
            </span>
          )}
        </span>
      </div>

      {/* Step body */}
      <div className="px-5 py-4 space-y-3">
        {Array.isArray(step.actions) && step.actions.length > 0 && (
          <ul className="space-y-1.5">
            {step.actions.map((action, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-slate-900 dark:text-white font-medium">
                <span className="text-hvac-gold font-bold shrink-0">→</span>
                {action}
              </li>
            ))}
          </ul>
        )}
        {step.yes && (
          <div className="text-sm text-slate-900 dark:text-white font-medium flex items-start gap-2">
            <span className="text-green-600 font-bold shrink-0">Yes:</span>
            {typeof step.yes === "string" ? step.yes : step.yes.action}
          </div>
        )}
        {step.no && (
          <div className="text-sm text-slate-900 dark:text-white font-medium flex items-start gap-2">
            <span className="text-hvac-safety font-bold shrink-0">No:</span>
            {typeof step.no === "string" ? step.no : step.no.action}
          </div>
        )}
        {step.interpretation && (
          <p className="text-sm font-semibold text-slate-800 dark:text-white border-l-2 border-hvac-blue pl-3">
            <strong className="text-hvac-blue">Result: </strong>
            <span dangerouslySetInnerHTML={{ __html: step.interpretation }} />
          </p>
        )}
        {step.field_insight && (
          <p 
            className="text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2"
            dangerouslySetInnerHTML={{ __html: `💡 ${step.field_insight}` }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-6 p-4 bg-blue-50 dark:bg-hvac-blue/10 border-l-4 border-hvac-blue rounded-r-xl shadow-sm">
        <p className="text-lg font-bold text-hvac-navy dark:text-blue-100 m-0 leading-relaxed">
          🚀 Start Here: Follow the diagnostic flow and diagram below to quickly identify what’s causing your AC Issue and what to do next.
        </p>
      </div>

      {/* DECISION TREE 🔥 */}
      {decisionTree && typeof decisionTree === "string" ? (
        <div className="mb-12">
          <MermaidDiagram chart={decisionTree.replace(/^```mermaid\s*|^```\s*/i, "").replace(/```$/i, "").trim()} title="Diagnostic Triage Flow" />
        </div>
      ) : decisionTree ? (
        <DecisionTree
          tree={decisionTree}
          slug={slug}
          onCauseIdentified={handleCauseIdentified}
        />
      ) : null}

      {/* ① AUTO-SCROLL TARGET — invisible anchor just below tree result */}
      <div ref={resultRef} className="-mt-4 pt-4" />

      {/* ④ SMART CTA — only appears after diagnosis */}
      {activeCauseId && (
        <section className="mb-6">
          <div className="bg-gradient-to-r from-hvac-navy to-hvac-blue rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <p className="text-xs font-black tracking-widest text-hvac-gold uppercase mb-1">Issue Identified</p>
              <h3 className="text-lg font-black text-white leading-tight">
                Need help fixing this?
              </h3>
              <p className="text-sm text-slate-300 mt-1">Get a local technician to confirm the diagnosis and repair.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="#"
                className="inline-block text-center px-5 py-2.5 bg-slate-300 text-slate-500 font-black rounded-lg cursor-not-allowed text-sm whitespace-nowrap"
              >
                Local Techs Coming Soon
              </a>
              <a
                href={`/repair/${slug}`}
                className="inline-block text-center px-5 py-2.5 border border-slate-400 text-white font-bold rounded-lg hover:border-white transition-colors text-sm whitespace-nowrap"
              >
                See Repair Guide →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ② DIAGNOSTIC FLOW — split into Recommended + Additional */}
      {hasFlow && (
        <section className="mb-12" id="diagnostic-flow">
          <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-2">
            Diagnostic Flow
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {activeCauseId
              ? "Relevant steps are highlighted. Follow them first to confirm the diagnosis."
              : "Follow these technician steps in sequence. Each step narrows the failure point."}
          </p>

          <div className="space-y-4">
            {/* RECOMMENDED STEPS — shown at top when cause identified */}
            {recommendedSteps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black tracking-widest text-hvac-gold uppercase">🎯 Recommended Steps for Your Issue</span>
                </div>
                {recommendedSteps.map((step, i) => renderStep(step, i, true))}
                {additionalSteps.length > 0 && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Checks</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}
              </div>
            )}

            {/* ADDITIONAL / ALL STEPS */}
            {additionalSteps.map((step, i) => renderStep(step, i, false))}
          </div>

          <p className="mt-6 text-base font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            👉 Once you’ve narrowed it down, see the likely cause, fix steps, and cost breakdown below.
          </p>
        </section>
      )}
    </>
  );
}

`

