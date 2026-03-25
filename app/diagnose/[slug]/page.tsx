import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getComponentsForPage } from "@/lib/components-for-page";
import { getToolsForPage } from "@/lib/tools-for-page";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import { buildLinksForPage } from "@/lib/link-engine";
import { normalizePageData } from "@/lib/content";
import SymptomPageTemplate from "@/templates/SymptomPageTemplate.LEGACY";
import GoldStandardPage from "@/components/gold/GoldStandardPage";
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

  if (aiPage?.schema_version === "v2_goldstandard") {
    return <GoldStandardPage data={aiPage.content_json} />;
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
