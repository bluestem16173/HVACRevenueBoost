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

// Enable ISR
export const revalidate = 3600;
export const dynamicParams = true; // allow pages not in generateStaticParams to render via SSR

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const fullSlug = `conditions/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(fullSlug);
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

  const fullSlug = `conditions/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(fullSlug);
  
  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  let rawContent: Record<string, unknown> | null = null;
  const pageContent = aiPage?.content_json ?? (aiPage as any)?.content;
  if (pageContent) {
    const raw = pageContent;
    rawContent = typeof raw === "string" ? (() => { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; } })() : (raw as Record<string, unknown>);
  }
  
  const qualityScore = aiPage?.quality_score ?? 100;

  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
  }

  // Allow rendering from AI content alone when symptom not in graph (canary-generated pages)
  if (!symptomData && rawContent) {
    const c = rawContent;
    const title = (c.title as string) ?? params.slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const rankedCauses = (c.rankedCauses as any[]) ?? [];
    symptomData = {
      id: params.slug,
      name: title,
      slug: params.slug,
      description: (c.fastAnswer as string) ?? (c.problem_summary as string) ?? "",
      causes: rankedCauses.map((r: any) => r.slug ?? r.id ?? r.name).filter(Boolean),
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
  const causeIds = causeDetails.map((c: any) => c.slug || c.id);

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
  } catch (e) {
    /* silent fail for static gen */
  }

  const pageViewModel = normalizePageData({
    rawContent,
    pageType: "symptom",
    slug: params.slug,
    title: symptom.name,
    graphCauses: causeDetails,
  });

  // Fetch components from DB (rule-based mapping). Prefer over AI when available.
  let dbComponents: Array<{ name: string; slug: string; description?: string; link: string }> = [];
  try {
    dbComponents = await getComponentsForPage(params.slug);
  } catch (e) {
    /* silent fail for static gen */
  }
  const mergedComponents = dbComponents.length > 0
    ? dbComponents.map((c) => ({ name: c.name, link: c.link, description: c.description }))
    : pageViewModel.components ?? [];

  const raw = rawContent as any;
  const scalingData = {
    conditions: raw?.conditions?.length 
      ? raw.conditions.slice(0, 5)
      : [
          "System runs but does not cool",
          "Cooling is inconsistent",
          "Airflow is weak from vents"
        ],
    environments: raw?.environments?.length
      ? raw.environments.slice(0, 5)
      : [
          "High outdoor temperatures",
          "After extended runtime",
          "Peak afternoon heat"
        ],
    noises: raw?.noises?.length
      ? raw.noises.slice(0, 4)
      : [
          "No unusual noise",
          "Buzzing sound",
          "Clicking noise"
        ],
    systemExplanation: raw?.system_explanation?.length === 4 
      ? raw.system_explanation 
      : [
          "Thermostat signals the system to begin cooling.",
          "Indoor unit absorbs heat from air.",
          "Outdoor unit releases collected heat.",
          "Refrigerant cycles continuously to maintain cooling."
        ],
    techObservation: raw?.tech_observation || "In the field, this issue is commonly tied to airflow or refrigerant imbalance. Proper diagnosis is recommended before repair.",
    mechanicalFieldNote: raw?.mechanical_field_note || "Compressor, evaporator/condenser coils, and thermostat failures cause reduced cooling. Compressor short-cycle or locked rotor indicates electrical or mechanical failure. Thermostat calibration drift causes overcooling or short cycles. Field note: Compressor replacement is major; verify refrigerant circuit integrity first.",
    repairMatrix: raw?.repair_matrix || {
      electrical: [
        { name: "Replace thermostat batteries", difficulty: "easy", estimated_cost_range: "$10–$30" },
        { name: "Replace capacitor", difficulty: "medium", estimated_cost_range: "$100–$300" },
        { name: "Control board replacement", difficulty: "hard", estimated_cost_range: "$400–$900" }
      ],
      mechanical: [
        { name: "Replace air filter", difficulty: "easy", estimated_cost_range: "$10–$40" },
        { name: "Clean evaporator coil", difficulty: "medium", estimated_cost_range: "$150–$400" },
        { name: "Blower motor replacement", difficulty: "hard", estimated_cost_range: "$400–$1,200" }
      ],
      structural: [
        { name: "Clear drain line", difficulty: "easy", estimated_cost_range: "$50–$150" },
        { name: "Seal duct leaks", difficulty: "medium", estimated_cost_range: "$200–$600" },
        { name: "Duct replacement", difficulty: "hard", estimated_cost_range: "$1,000–$5,000" }
      ],
      chemical: [
        { name: "Acid wash condenser", difficulty: "medium", estimated_cost_range: "$150–$350" },
        { name: "Recharge refrigerant", difficulty: "hard", estimated_cost_range: "$200–$600" },
        { name: "Fix refrigerant leak", difficulty: "hard", estimated_cost_range: "$500–$1,500" }
      ]
    }
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
    />
  );
}
