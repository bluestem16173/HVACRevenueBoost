import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getComponentsForPage } from "@/lib/components-for-page";
import { getToolsForPage } from "@/lib/tools-for-page";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import { buildLinksForPage } from "@/lib/link-engine";
import { normalizePageData } from "@/lib/content";
import SymptomPageTemplate from "@/templates/symptom-page";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600;
export const dynamicParams = true; // allow pages not in generateStaticParams to render via SSR

export async function generateStaticParams() {
  return SYMPTOMS.map((s) => ({
    slug: s.id,
  }));
}

export default async function SymptomPage({ params }: { params: { slug: string } }) {
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  // Fetch AI-generated page from Neon (DB stores full slug: conditions/xxx)
  const fullSlug = `conditions/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(fullSlug);
  let rawContent: Record<string, unknown> | null = null;
  const pageContent = aiPage?.content_json ?? (aiPage as any)?.content;
  if (pageContent) {
    const raw = pageContent;
    rawContent = typeof raw === "string" ? (() => { try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; } })() : (raw as Record<string, unknown>);
  }

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

  return (
    <SymptomPageTemplate
      symptom={symptom}
      pageViewModel={{ ...pageViewModel, components: mergedComponents }}
      causeIds={causeIds}
      causeDetails={causeDetails}
      diagnosticSteps={diagnosticSteps}
      relatedContent={relatedContent}
      internalLinks={internalLinks}
      relatedLinks={relatedLinks}
      tools={tools}
      getCauseDetails={getCauseDetails}
    />
  );
}
