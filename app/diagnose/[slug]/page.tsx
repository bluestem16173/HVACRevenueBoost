import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import { buildLinksForPage } from "@/lib/link-engine";
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

  // Fetch the AI generated page from Neon (try both slug formats)
  const aiPage = await getDiagnosticPageFromDB(params.slug) || await getDiagnosticPageFromDB(`diagnose/${params.slug}`);
  const htmlContent = aiPage?.content_json?.html_content || null;
  const contentJson = aiPage?.content_json || null;

  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
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
    const { getToolsFromDB } = require("@/lib/db");
    tools = await getToolsFromDB();
  } catch(e) { /* silent fail for static gen */ }

  return (
    <SymptomPageTemplate
      symptom={symptom}
      causeIds={causeIds}
      causeDetails={causeDetails}
      diagnosticSteps={diagnosticSteps}
      relatedContent={relatedContent}
      internalLinks={internalLinks}
      relatedLinks={relatedLinks}
      tools={tools}
      getCauseDetails={getCauseDetails}
      htmlContent={htmlContent}
      contentJson={contentJson}
    />
  );
}
